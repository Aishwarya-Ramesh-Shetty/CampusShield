import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import SecurityScan, { CONTROLLED_TARGET } from '../src/models/SecurityScan.js';
import SecurityTestResult from '../src/models/SecurityTestResult.js';
import { calculateSecurityScore, countFindingsBySeverity } from '../src/security/rules/severity.js';
import { securityTestRegistry } from '../src/security/tests/securityTestRegistry.js';
import { sanitizeEvidence } from '../src/security/utils/evidence.js';

const jwtSecret = 'test-only-signing-secret-with-at-least-32-bytes';

function matchesFilter(record, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = record[key];
    if (expected && typeof expected === 'object' && '$in' in expected) return expected.$in.includes(actual);
    return String(actual) === String(expected);
  });
}

function createMemoryModel(initialRecords = []) {
  const records = [...initialRecords];
  let nextId = records.length + 1;

  function createQuery(values, single = false) {
    let data = Array.isArray(values) ? [...values] : values;
    const query = {
      select() { return this; },
      sort(fields = {}) {
        if (Array.isArray(data)) {
          const field = Object.keys(fields)[0];
          const direction = fields[field] ?? 1;
          data = [...data].sort((left, right) => {
            if (left[field] === right[field]) return 0;
            return direction === -1 ? (left[field] > right[field] ? -1 : 1) : (left[field] > right[field] ? 1 : -1);
          });
        }
        return this;
      },
      limit(maximum) {
        if (Array.isArray(data)) data = data.slice(0, maximum);
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve(data).then(resolve, reject);
      },
    };
    return query;
  }

  return {
    records,
    async create(input) {
      const record = {
        ...input,
        _id: String(nextId++),
        async save() {
          if (!records.includes(this)) records.push(this);
        },
      };
      records.push(record);
      return record;
    },
    find(filter = {}) {
      return createQuery(records.filter((record) => matchesFilter(record, filter)));
    },
    findOne(filter = {}) {
      return createQuery(records.find((record) => matchesFilter(record, filter)) ?? null, true);
    },
    findById(id) {
      return createQuery(records.find((record) => String(record._id) === String(id)) ?? null, true);
    },
    async countDocuments(filter = {}) {
      return records.filter((record) => matchesFilter(record, filter)).length;
    },
  };
}

async function createContext() {
  const password = await bcrypt.hash('AssessmentDev!2026', 12);
  const UserModel = createMemoryModel();
  await UserModel.create({ name: 'Student Test', email: 'student@example.test', password, role: 'student', studentId: 'TEST-1', tokenVersion: 0 });
  await UserModel.create({ name: 'Admin Test', email: 'admin@example.test', password, role: 'admin', studentId: '', tokenVersion: 0 });
  await UserModel.create({ name: 'Assessor Test', email: 'assessor@example.test', password, role: 'security_assessor', studentId: '', tokenVersion: 0 });

  const SecurityScanModel = createMemoryModel();
  const SecurityTestResultModel = createMemoryModel();
  const VulnerabilityFindingModel = createMemoryModel();
  const SecurityAuditEventModel = createMemoryModel();
  const fetchCalls = [];
  const securityFetch = async (url, options) => {
    fetchCalls.push({ url: String(url), options });
    return new Response(JSON.stringify({ success: true, email: 'student@example.test', password: 'must-not-be-stored' }), { status: 200 });
  };

  const app = createApp({
    UserModel,
    SecurityScanModel,
    SecurityTestResultModel,
    VulnerabilityFindingModel,
    SecurityAuditEventModel,
    securityTargetOrigin: 'http://127.0.0.1:5000',
    securityFetch,
    jwtSecret,
  });

  return { app, SecurityScanModel, SecurityTestResultModel, VulnerabilityFindingModel, SecurityAuditEventModel, fetchCalls };
}

async function signedInAgent(app, email) {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ email, password: 'AssessmentDev!2026' }).expect(200);
  return agent;
}

describe('controlled security assessment framework', () => {
  let context;
  before(async () => {
    context = await createContext();
  });

  it('requires authentication and the exact security assessor role', async () => {
    await request(context.app).get('/api/security/dashboard').expect(401);
    await request(context.app).get('/api/security/scans').expect(401);
    await request(context.app).get('/api/security/findings').expect(401);

    const student = await signedInAgent(context.app, 'student@example.test');
    await student.get('/api/security/dashboard').expect(403);
    await student.get('/api/security/scans').expect(403);
    await student.post('/api/security/scans').expect(403);

    const admin = await signedInAgent(context.app, 'admin@example.test');
    await admin.get('/api/security/dashboard').expect(403);
    await admin.get('/api/security/scans').expect(403);
    await admin.get('/api/security/findings').expect(403);

    const assessor = await signedInAgent(context.app, 'assessor@example.test');
    const dashboard = await assessor.get('/api/security/dashboard').expect(200);
    assert.equal(dashboard.body.data.securityScore, 100);
  });

  it('rejects client-selected targets and does not accept direct finding creation', async () => {
    const assessor = await signedInAgent(context.app, 'assessor@example.test');
    await assessor.post('/api/security/scans').send({ target: 'https://example.com' }).expect(400);
    await assessor.post('/api/security/scans').send({ target: 'http://localhost:5000' }).expect(400);
    await assessor.post('/api/security/findings').send({ title: 'Client-created finding' }).expect(404);
    assert.equal(context.fetchCalls.length, 0);
    assert.equal(context.SecurityScanModel.records.length, 0);
    assert.equal(context.VulnerabilityFindingModel.records.length, 0);
  });

  it('runs the registered health check sequentially, records PASS, summarizes, audits, and retrieves the scan', async () => {
    const assessor = await signedInAgent(context.app, 'assessor@example.test');
    const response = await assessor.post('/api/security/scans').expect(201);
    const scan = response.body.data;

    assert.equal(scan.status, 'completed');
    assert.equal(scan.target, 'Local College Portal');
    assert.equal(scan.totalTests, 1);
    assert.equal(scan.passedTests, 1);
    assert.equal(scan.failedTests, 0);
    assert.equal(scan.totalFindings, 0);
    assert.equal(scan.securityScore, 100);
    assert.equal(context.fetchCalls.length, 1);
    assert.equal(context.fetchCalls[0].url, 'http://127.0.0.1:5000/api/health');
    const auditEvents = context.SecurityAuditEventModel.records;
    assert.equal(auditEvents.map((event) => event.action).join(','), 'SCAN_STARTED,SCAN_COMPLETED');
    assert.equal(auditEvents.every((event) => event.assessor === '3'), true);

    const history = await assessor.get('/api/security/scans').expect(200);
    assert.equal(history.body.data.length, 1);
    const detail = await assessor.get(`/api/security/scans/${scan.scanId}`).expect(200);
    assert.equal(detail.body.data.scanId, scan.scanId);
    const results = await assessor.get(`/api/security/scans/${scan.scanId}/results`).expect(200);
    assert.equal(results.body.data.length, 1);
    assert.equal(results.body.data[0].testId, 'SECURITY-BASELINE-001');
    assert.equal(results.body.data[0].status, 'PASS');
    assert.equal(JSON.stringify(results.body.data[0].evidence).includes('must-not-be-stored'), false);
    assert.equal(JSON.stringify(results.body.data[0].evidence).includes('student@example.test'), false);
    assert.equal((await assessor.get(`/api/security/scans/${scan.scanId}/findings`).expect(200)).body.data.length, 0);
    assert.equal((await assessor.get('/api/security/findings').expect(200)).body.data.length, 0);
  });

  it('registers only the harmless baseline check and redacts evidence secrets', () => {
    assert.deepEqual(securityTestRegistry.map((test) => test.id), ['SECURITY-BASELINE-001']);
    const evidence = sanitizeEvidence({
      request: { method: 'GET', endpoint: '/api/health', authorization: 'Bearer abc.def.ghi' },
      note: 'JWT eyJhbGci.eyJzdWI.abc and mongodb://user:secret@localhost/db',
      contact: 'assessor@example.test',
    });
    assert.equal(evidence.request.authorization, '[REDACTED]');
    assert.equal(evidence.note.includes('eyJhbGci'), false);
    assert.equal(evidence.note.includes('mongodb://'), false);
    assert.equal(evidence.contact, '[REDACTED]');
  });

  it('uses the documented academic score weights and clamps at zero', () => {
    assert.equal(calculateSecurityScore([
      { severity: 'Critical' },
      { severity: 'High' },
      { severity: 'Medium' },
      { severity: 'Low' },
      { severity: 'Informational' },
    ]), 49);
    assert.equal(calculateSecurityScore(Array.from({ length: 5 }, () => ({ severity: 'Critical' }))), 0);
    assert.deepEqual(countFindingsBySeverity([{ severity: 'High' }, { severity: 'Low' }]), {
      criticalCount: 0,
      highCount: 1,
      mediumCount: 0,
      lowCount: 1,
      informationalCount: 0,
    });
  });

  it('constrains persisted scan targets and result statuses at the schema boundary', async () => {
    const initiatedBy = new SecurityScan()._id;
    const validScan = new SecurityScan({ scanId: 'schema-test', initiatedBy });
    assert.equal(validScan.target, CONTROLLED_TARGET);
    assert.equal(validScan.status, 'pending');
    await validScan.validate();

    const externalTarget = new SecurityScan({ scanId: 'external-target', initiatedBy, target: 'https://example.invalid' });
    await assert.rejects(externalTarget.validate(), (error) => error.errors.target?.kind === 'enum');

    const invalidResult = new SecurityTestResult({
      scan: validScan._id,
      testId: 'schema-test',
      testName: 'Schema test',
      category: 'Baseline',
      description: 'Schema validation only.',
      status: 'EXPLOIT',
      severity: 'Informational',
      duration: 0,
    });
    await assert.rejects(invalidResult.validate(), (error) => error.errors.status?.kind === 'enum');
  });
});
