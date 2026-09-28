import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

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

function createMemoryModel(initialRecords = []) {
  const records = [...initialRecords];
  let nextId = 1;

  function matchesFilter(record, filter = {}) {
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null && value.$eq !== undefined) {
        return record[key] === value.$eq;
      }
      return record[key] === value;
    });
  }

  function createQuery(items) {
    return {
      data: [...items],
      sort(sortField) {
        const field = Object.keys(sortField || {})[0];
        const direction = sortField?.[field] ?? 1;
        this.data = [...this.data].sort((left, right) => {
          const leftValue = left[field];
          const rightValue = right[field];
          if (leftValue === rightValue) return 0;
          return direction === -1 ? (leftValue > rightValue ? -1 : 1) : (leftValue > rightValue ? 1 : -1);
        });
        return this;
      },
      limit(limitValue) {
        this.data = this.data.slice(0, limitValue);
        return this;
      },
      exec: async () => this.data,
      then(resolve, reject) {
        return Promise.resolve(this.data).then(resolve, reject);
      },
    };
  }

  return {
    records,
    async create(input) {
      const record = { ...input, _id: String(nextId++), async save() {} };
      records.push(record);
      return record;
    },
    async findOne(filter = {}) {
      return records.find((record) => matchesFilter(record, filter)) ?? null;
    },
    find(filter = {}) {
      return createQuery(records.filter((record) => matchesFilter(record, filter)));
    },
    async findById(id) {
      return records.find((record) => String(record._id) === String(id)) ?? null;
    },
    async countDocuments(filter = {}) {
      return records.filter((record) => matchesFilter(record, filter)).length;
    },
  };
}

describe('secure student and admin portal data flow', () => {
  it('returns the authenticated student dashboard, profile, marks, attendance, fees, and notices', async () => {
    const UserModel = createMemoryUserModel();
    const StudentModel = createMemoryModel([
      {
        _id: 's-1',
        user: 'u-1',
        studentId: 'STU-1001',
        name: 'Ada Smith',
        email: 'student@example.com',
        course: 'BSc Computer Science',
        department: 'Computer Science',
        year: 3,
        semester: 6,
        division: 'A',
        phone: '9876543210',
        dateOfBirth: '2004-04-12',
        address: 'Bengaluru',
        admissionYear: 2022,
      },
    ]);
    const MarkModel = createMemoryModel([
      { student: 's-1', subject: 'Algorithms', subjectCode: 'CS301', internalMarks: 24, externalMarks: 46, totalMarks: 70, grade: 'A', semester: 6 },
      { student: 's-1', subject: 'Operating Systems', subjectCode: 'CS302', internalMarks: 22, externalMarks: 48, totalMarks: 70, grade: 'A', semester: 6 },
    ]);
    const AttendanceModel = createMemoryModel([
      { student: 's-1', subject: 'Algorithms', subjectCode: 'CS301', totalClasses: 50, attendedClasses: 45, attendancePercentage: 90, semester: 6 },
      { student: 's-1', subject: 'Operating Systems', subjectCode: 'CS302', totalClasses: 40, attendedClasses: 36, attendancePercentage: 90, semester: 6 },
    ]);
    const FeeModel = createMemoryModel([
      { student: 's-1', academicYear: '2025-26', semester: 6, totalAmount: 85000, paidAmount: 60000, pendingAmount: 25000, paymentStatus: 'Partial', dueDate: '2025-12-15' },
    ]);
    const NoticeModel = createMemoryModel([
      { title: 'Exam timetable published', description: 'Check the latest timetable.', category: 'Academic', isActive: true, createdBy: 'admin', publishedAt: '2025-09-01', expiresAt: '2025-09-30' },
    ]);

    const passwordHash = await bcrypt.hash('correct-password', 12);
    const user = await UserModel.create({
      name: 'Ada Smith',
      email: 'student@example.com',
      password: passwordHash,
      role: 'student',
      studentId: 'STU-1001',
    });
    StudentModel.records[0].user = user._id;
    const app = createApp({ UserModel, StudentModel, MarkModel, AttendanceModel, FeeModel, NoticeModel, jwtSecret });

    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email: 'student@example.com', password: 'correct-password' }).expect(200);

    const dashboard = await agent.get('/api/students/dashboard').expect(200);
    assert.equal(dashboard.body.success, true);
    assert.equal(dashboard.body.data.profile.name, 'Ada Smith');
    assert.equal(dashboard.body.data.profile.studentId, 'STU-1001');
    assert.equal(dashboard.body.data.marks.length, 2);
    assert.equal(dashboard.body.data.fees[0].paymentStatus, 'Partial');
    assert.equal(dashboard.body.data.notices[0].title, 'Exam timetable published');

    const profile = await agent.get('/api/students/profile').expect(200);
    assert.equal(profile.body.data.name, 'Ada Smith');

    const marks = await agent.get('/api/students/marks').expect(200);
    assert.equal(marks.body.data[0].subject, 'Algorithms');

    const attendance = await agent.get('/api/students/attendance').expect(200);
    assert.equal(attendance.body.data[0].attendancePercentage, 90);

    const fees = await agent.get('/api/students/fees').expect(200);
    assert.equal(fees.body.data[0].pendingAmount, 25000);

    const notices = await agent.get('/api/students/notices').expect(200);
    assert.equal(notices.body.data[0].category, 'Academic');
  });

  it('allows admins to view student records and manage notices while blocking student access to admin APIs', async () => {
    const UserModel = createMemoryUserModel();
    const StudentModel = createMemoryModel([
      {
        _id: 's-1',
        user: 'u-1',
        studentId: 'STU-1001',
        name: 'Ada Smith',
        email: 'student@example.com',
        course: 'BSc Computer Science',
        department: 'Computer Science',
        year: 3,
        semester: 6,
        division: 'A',
        phone: '9876543210',
        dateOfBirth: '2004-04-12',
        address: 'Bengaluru',
        admissionYear: 2022,
      },
    ]);
    const MarkModel = createMemoryModel([]);
    const AttendanceModel = createMemoryModel([]);
    const FeeModel = createMemoryModel([]);
    const NoticeModel = createMemoryModel([
      { _id: 'n-1', title: 'New lab schedule', description: 'Lab schedule updated.', category: 'Academic', createdBy: 'admin', publishedAt: '2025-09-01', expiresAt: '2025-09-20', isActive: true },
    ]);

    const studentUser = await UserModel.create({ name: 'Ada Smith', email: 'student@example.com', password: await bcrypt.hash('correct-password', 12), role: 'student', studentId: 'STU-1001' });
    const adminUser = await UserModel.create({ name: 'Admin User', email: 'admin@example.com', password: await bcrypt.hash('correct-password', 12), role: 'admin', studentId: '' });
    StudentModel.records[0].user = studentUser._id;

    const app = createApp({ UserModel, StudentModel, MarkModel, AttendanceModel, FeeModel, NoticeModel, jwtSecret });

    const studentAgent = request.agent(app);
    await studentAgent.post('/api/auth/login').send({ email: 'student@example.com', password: 'correct-password' }).expect(200);
    await studentAgent.get('/api/admin/dashboard').expect(403);
    await studentAgent.post('/api/admin/notices').send({ title: 'Sneaky notice', description: 'Nope', category: 'Academic' }).expect(403);

    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({ email: 'admin@example.com', password: 'correct-password' }).expect(200);
    const adminDashboard = await adminAgent.get('/api/admin/dashboard').expect(200);
    assert.equal(adminDashboard.body.success, true);

    const students = await adminAgent.get('/api/admin/students').expect(200);
    assert.equal(students.body.data.totalStudents, 1);

    const detail = await adminAgent.get(`/api/admin/students/${StudentModel.records[0]._id}`).expect(200);
    assert.equal(detail.body.data.student.name, 'Ada Smith');

    const createdNotice = await adminAgent.post('/api/admin/notices').send({ title: 'Guest lecture', description: 'Attend the guest lecture.', category: 'Event', expiresAt: '2025-10-30' }).expect(201);
    assert.equal(createdNotice.body.data.title, 'Guest lecture');

    const updateNotice = await adminAgent.put(`/api/admin/notices/${createdNotice.body.data._id}`).send({ title: 'Updated guest lecture', isActive: true }).expect(200);
    assert.equal(updateNotice.body.data.title, 'Updated guest lecture');

    const deleteNotice = await adminAgent.delete(`/api/admin/notices/${createdNotice.body.data._id}`).expect(200);
    assert.equal(deleteNotice.body.success, true);
  });
});
