import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import { getAuthCookieOptions, getClearCookieOptions } from '../src/security/authCookie.js';

const jwtSecret = 'test-only-signing-secret-with-at-least-32-bytes';

function createMemoryUserModel() {
  const users = new Map();
  let nextId = 1;

  function makeQuery(resolver) {
    return {
      select() { return this; },
      then(resolve, reject) {
        return Promise.resolve().then(resolver).then(resolve, reject);
      },
    };
  }

  return {
    users,
    async create(input) {
      if ([...users.values()].some((user) => user.email === input.email)) {
        const error = new Error('duplicate');
        error.code = 11000;
        throw error;
      }
      const user = {
        ...input,
        _id: String(nextId++),
        tokenVersion: 0,
        async save() { users.set(this._id, this); },
      };
      users.set(user._id, user);
      return user;
    },
    findOne(filter) {
      return makeQuery(() => [...users.values()].find((user) => user.email === filter.email) ?? null);
    },
    findById(id) {
      return makeQuery(() => users.get(String(id)) ?? null);
    },
  };
}

function createEmptyPortalModel({ findOne } = {}) {
  function createQuery() {
    return {
      sort() { return this; },
      limit() { return this; },
      then(resolve, reject) { return Promise.resolve([]).then(resolve, reject); },
    };
  }

  return {
    findOne: findOne ?? (async () => null),
    find: createQuery,
    async countDocuments() { return 0; },
  };
}

function createEmptySecurityModel() {
  function createQuery(value) {
    return {
      sort() { return this; },
      limit() { return this; },
      then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
    };
  }

  return {
    find() { return createQuery([]); },
    findOne() { return createQuery(null); },
    async countDocuments() { return 0; },
    async create(input) { return { ...input, _id: 'test-security-record', async save() {} }; },
  };
}

async function addRoleAccount(UserModel, role, email) {
  const password = await bcrypt.hash('DevelopmentPassword!2026', 12);
  return UserModel.create({ name: role, email, password, role, studentId: '' });
}

function createTestServer() {
  const UserModel = createMemoryUserModel();
  const StudentModel = createEmptyPortalModel({
    findOne: async ({ user }) => ({
      _id: `student-${user}`,
      studentId: '',
      name: 'Test Student',
      email: 'student@example.com',
      course: 'Test Course',
      department: 'Test Department',
      year: 1,
      semester: 1,
      division: 'A',
      phone: '',
      admissionYear: 2026,
    }),
  });
  const MarkModel = createEmptyPortalModel();
  const AttendanceModel = createEmptyPortalModel();
  const FeeModel = createEmptyPortalModel();
  const NoticeModel = createEmptyPortalModel();
  const SecurityScanModel = createEmptySecurityModel();
  const SecurityTestResultModel = createEmptySecurityModel();
  const VulnerabilityFindingModel = createEmptySecurityModel();
  const SecurityAuditEventModel = createEmptySecurityModel();
  return {
    UserModel,
    app: createApp({
      UserModel,
      StudentModel,
      MarkModel,
      AttendanceModel,
      FeeModel,
      NoticeModel,
      SecurityScanModel,
      SecurityTestResultModel,
      VulnerabilityFindingModel,
      SecurityAuditEventModel,
      securityFetch: async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
      jwtSecret,
    }),
  };
}

describe('authentication and authorization baseline', () => {
  it('keeps password selection disabled and rejects plaintext at the Mongoose schema boundary', async () => {
    assert.equal(User.schema.path('password').options.select, false);
    assert.equal(User.schema.options.timestamps, true);
    assert.equal(User.schema.path('email').options.unique, true);
    const user = new User({ name: 'Test User', email: 'test@example.com', password: 'plaintext', role: 'student' });
    await assert.rejects(user.validate(), /Password must be bcrypt-hashed before storage/);
  });

  it('uses credentialed CORS for only the configured origin and secure production cookie defaults', async () => {
    const { app } = createTestServer();
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173').expect(200);
    assert.equal(allowed.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(allowed.headers['access-control-allow-credentials'], 'true');
    const otherOrigin = await request(app).get('/api/health').set('Origin', 'https://example.invalid').expect(200);
    assert.equal(otherOrigin.headers['access-control-allow-origin'], undefined);
    assert.equal(getAuthCookieOptions('production').secure, true);
    assert.equal(getAuthCookieOptions('development').secure, false);
    assert.deepEqual(getClearCookieOptions('development'), {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('registers normalized student accounts with bcrypt hashes and rejects duplicate or elevated roles', async () => {
    const { app, UserModel } = createTestServer();
    const details = { name: 'Test Student', email: '  STUDENT@Example.com ', password: 'A-development-password-2026!', studentId: 'S-100', role: 'admin' };

    const created = await request(app).post('/api/auth/register').send(details).expect(201);
    assert.equal(created.body.user.role, 'student');
    assert.equal(created.body.user.email, 'student@example.com');
    assert.equal('password' in created.body.user, false);
    const stored = [...UserModel.users.values()][0];
    assert.notEqual(stored.password, details.password);
    assert.equal(await bcrypt.compare(details.password, stored.password), true);
    assert.equal(await request(app).post('/api/auth/register').send(details).then((result) => result.status), 409);
    assert.equal((await request(app).post('/api/auth/register').send({ ...details, email: 'broken' })).status, 400);
  });

  it('delivers the JWT only in an HTTP-only cookie and uses generic credential failures', async () => {
    const { app } = createTestServer();
    await request(app).post('/api/auth/register').send({ name: 'Test Student', email: 'student@example.com', password: 'A-development-password-2026!', studentId: 'S-100' }).expect(201);

    const login = await request(app).post('/api/auth/login').send({ email: ' STUDENT@example.com', password: 'A-development-password-2026!' }).expect(200);
    const setCookie = login.headers['set-cookie'][0];
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(setCookie, /Max-Age=900/i);
    assert.match(setCookie, /Path=\//i);
    assert.doesNotMatch(setCookie, /Secure/i);
    assert.doesNotMatch(JSON.stringify(login.body), /eyJ[A-Za-z0-9_-]+\./);
    assert.equal('password' in login.body.user, false);

    const invalid = await request(app).post('/api/auth/login').send({ email: 'student@example.com', password: 'incorrect-password' }).expect(401);
    assert.equal(invalid.body.message, 'Invalid email or password.');
    const missing = await request(app).post('/api/auth/login').send({ email: 'absent@example.com', password: 'incorrect-password' }).expect(401);
    assert.equal(missing.body.message, invalid.body.message);
  });

  it('requires authentication and enforces exact roles on portal endpoints', async () => {
    const { app, UserModel } = createTestServer();
    await request(app).get('/api/health').expect(200);
    await addRoleAccount(UserModel, 'student', 'student@example.com');
    await addRoleAccount(UserModel, 'admin', 'admin@example.com');
    await addRoleAccount(UserModel, 'security_assessor', 'security@example.com');

    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/students/dashboard').expect(401);
    await request(app).get('/api/admin/dashboard').expect(401);

    const student = request.agent(app);
    await student.post('/api/auth/login').send({ email: 'student@example.com', password: 'DevelopmentPassword!2026' }).expect(200);
    const me = await student.get('/api/auth/me').expect(200);
    assert.equal(me.body.user.role, 'student');
    assert.equal('password' in me.body.user, false);
    await student.get('/api/students/dashboard').expect(200);
    await student.get('/api/admin/dashboard').expect(403);
    await student.get('/api/security/dashboard').expect(403);

    const admin = request.agent(app);
    await admin.post('/api/auth/login').send({ email: 'admin@example.com', password: 'DevelopmentPassword!2026' }).expect(200);
    await admin.get('/api/admin/dashboard').expect(200);
    await admin.get('/api/students/dashboard').expect(403);

    const assessor = request.agent(app);
    await assessor.post('/api/auth/login').send({ email: 'security@example.com', password: 'DevelopmentPassword!2026' }).expect(200);
    await assessor.get('/api/security/dashboard').expect(200);
    await assessor.get('/api/admin/dashboard').expect(403);
  });

  it('clears the cookie and revokes the session token on logout', async () => {
    const { app } = createTestServer();
    await request(app).post('/api/auth/register').send({ name: 'Test Student', email: 'student@example.com', password: 'A-development-password-2026!', studentId: 'S-100' }).expect(201);
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').send({ email: 'student@example.com', password: 'A-development-password-2026!' }).expect(200);
    const oldCookie = login.headers['set-cookie'][0].split(';')[0];

    const logout = await agent.post('/api/auth/logout').expect(200);
    assert.match(logout.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/i);
    await agent.get('/api/students/dashboard').expect(401);
    await request(app).get('/api/students/dashboard').set('Cookie', oldCookie).expect(401);
  });
});