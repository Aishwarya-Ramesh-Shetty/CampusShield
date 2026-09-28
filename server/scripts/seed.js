import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import Attendance from '../src/models/Attendance.js';
import Fee from '../src/models/Fee.js';
import Mark from '../src/models/Mark.js';
import Notice from '../src/models/Notice.js';
import Student from '../src/models/Student.js';
import User from '../src/models/User.js';

const studentSeedData = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    studentId: 'STU-2024001',
    course: 'BSc Computer Science',
    department: 'Computer Science',
    year: 3,
    semester: 6,
    division: 'A',
    phone: '9876543210',
    dateOfBirth: '2004-04-12',
    address: 'Bengaluru, Karnataka',
    admissionYear: 2022,
  },
  {
    name: 'Meera Nair',
    email: 'meera.nair@example.com',
    studentId: 'STU-2024002',
    course: 'BBA',
    department: 'Business Administration',
    year: 2,
    semester: 4,
    division: 'B',
    phone: '9876543211',
    dateOfBirth: '2005-02-10',
    address: 'Kochi, Kerala',
    admissionYear: 2023,
  },
  {
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    studentId: 'STU-2024003',
    course: 'BTech Electronics',
    department: 'Electronics',
    year: 4,
    semester: 8,
    division: 'A',
    phone: '9876543212',
    dateOfBirth: '2003-08-22',
    address: 'Jaipur, Rajasthan',
    admissionYear: 2021,
  },
  {
    name: 'Sneha Iyer',
    email: 'sneha.iyer@example.com',
    studentId: 'STU-2024004',
    course: 'BSc Information Technology',
    department: 'IT',
    year: 3,
    semester: 6,
    division: 'C',
    phone: '9876543213',
    dateOfBirth: '2004-01-18',
    address: 'Hyderabad, Telangana',
    admissionYear: 2022,
  },
  {
    name: 'Karan Singh',
    email: 'karan.singh@example.com',
    studentId: 'STU-2024005',
    course: 'BCom',
    department: 'Commerce',
    year: 2,
    semester: 4,
    division: 'A',
    phone: '9876543214',
    dateOfBirth: '2005-11-05',
    address: 'Lucknow, Uttar Pradesh',
    admissionYear: 2023,
  },
];

const defaultUsers = [
  { name: 'Development Student', email: 'student@example.com', password: 'StudentDev!2026', role: 'student', studentId: 'DEV-STU-001' },
  { name: 'Development Admin', email: 'admin@example.com', password: 'AdminDev!2026', role: 'admin', studentId: '' },
  { name: 'Development Assessor', email: 'security@example.com', password: 'SecurityDev!2026', role: 'security_assessor', studentId: '' },
];

const noticeSeedData = [
  {
    title: 'Mid-semester exam timetable released',
    description: 'Students are advised to check the newly published timetable and prepare accordingly.',
    category: 'Academic',
    createdBy: 'admin',
    publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    expiresAt: new Date('2026-09-30T00:00:00.000Z'),
    isActive: true,
  },
  {
    title: 'Library hours extended',
    description: 'The central library will remain open until 9:00 PM for final-year students during the revision week.',
    category: 'Administrative',
    createdBy: 'admin',
    publishedAt: new Date('2026-09-05T00:00:00.000Z'),
    expiresAt: new Date('2026-09-25T00:00:00.000Z'),
    isActive: true,
  },
  {
    title: 'Campus recruitment orientation',
    description: 'A placement orientation session will be held in the seminar hall this Friday.',
    category: 'Event',
    createdBy: 'admin',
    publishedAt: new Date('2026-09-08T00:00:00.000Z'),
    expiresAt: new Date('2026-09-18T00:00:00.000Z'),
    isActive: true,
  },
];

async function createSeedData() {
  if (process.env.NODE_ENV !== 'development') {
    console.error('Refusing to seed: set NODE_ENV=development explicitly.');
    process.exitCode = 1;
    return;
  }

  await connectDatabase(env.mongodbUri);

  for (const seedUser of defaultUsers) {
    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    await User.updateOne(
      { email: seedUser.email },
      { $set: { ...seedUser, password: passwordHash } },
      { upsert: true, runValidators: true },
    );
  }

  for (const profile of studentSeedData) {
    const existingUser = await User.findOne({ email: profile.email });
    if (!existingUser) {
      const user = await User.create({
        name: profile.name,
        email: profile.email,
        password: await bcrypt.hash('StudentDev!2026', 12),
        role: 'student',
        studentId: profile.studentId,
      });

      await Student.updateOne(
        { studentId: profile.studentId },
        { $set: { ...profile, user: user._id } },
        { upsert: true, runValidators: true },
      );
    }
  }

  for (const profile of studentSeedData) {
    const student = await Student.findOne({ studentId: profile.studentId });
    if (!student) continue;

    await Mark.deleteMany({ student: student._id });
    await Attendance.deleteMany({ student: student._id });
    await Fee.deleteMany({ student: student._id });

    const subjects = [
      { subject: 'Data Structures', subjectCode: 'CS201', internalMarks: 24, externalMarks: 48, totalMarks: 72, grade: 'A' },
      { subject: 'Operating Systems', subjectCode: 'CS202', internalMarks: 22, externalMarks: 46, totalMarks: 68, grade: 'B+' },
      { subject: 'Web Technologies', subjectCode: 'CS203', internalMarks: 26, externalMarks: 52, totalMarks: 78, grade: 'A' },
    ];

    for (const subject of subjects) {
      await Mark.create({ student: student._id, ...subject, semester: profile.semester });
    }

    for (const subject of subjects) {
      await Attendance.create({
        student: student._id,
        subject: subject.subject,
        subjectCode: subject.subjectCode,
        totalClasses: 40,
        attendedClasses: Math.round(40 * (profile.semester >= 6 ? 0.88 : 0.82)),
        attendancePercentage: profile.semester >= 6 ? 88 : 82,
        semester: profile.semester,
      });
    }

    await Fee.create({
      student: student._id,
      academicYear: '2025-26',
      semester: profile.semester,
      totalAmount: 85000,
      paidAmount: profile.semester >= 6 ? 70000 : 55000,
      pendingAmount: profile.semester >= 6 ? 15000 : 30000,
      paymentStatus: profile.semester >= 6 ? 'Partial' : 'Pending',
      dueDate: '2026-12-15',
    });
  }

  await Notice.deleteMany({});
  for (const notice of noticeSeedData) {
    await Notice.create(notice);
  }

  console.log('Development seed completed with fictional student, academic, and notice data.');
}

try {
  await createSeedData();
} catch (error) {
  console.error(`Development seed failed (${error.name}). Check MongoDB configuration and availability.`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}