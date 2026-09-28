import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import Attendance from './models/Attendance.js';
import Fee from './models/Fee.js';
import Mark from './models/Mark.js';
import Notice from './models/Notice.js';
import SecurityAuditEvent from './models/SecurityAuditEvent.js';
import SecurityScan from './models/SecurityScan.js';
import SecurityTestResult from './models/SecurityTestResult.js';
import Student from './models/Student.js';
import User from './models/User.js';
import VulnerabilityFinding from './models/VulnerabilityFinding.js';
import { createApiRouter } from './routes/index.js';

export function createApp({
	UserModel = User,
	StudentModel = Student,
	MarkModel = Mark,
	AttendanceModel = Attendance,
	FeeModel = Fee,
	NoticeModel = Notice,
	SecurityScanModel = SecurityScan,
	SecurityTestResultModel = SecurityTestResult,
	VulnerabilityFindingModel = VulnerabilityFinding,
	SecurityAuditEventModel = SecurityAuditEvent,
	securityTargetOrigin = `http://127.0.0.1:${env.port}`,
	securityFetch = globalThis.fetch,
	jwtSecret = env.jwtSecret,
} = {}) {
	const app = express();

	app.use(cors({
		origin: (origin, callback) => callback(null, origin === env.clientUrl),
		credentials: true,
	}));
	app.use(express.json({ limit: '32kb' }));
	app.use(cookieParser());
	app.use('/api', createApiRouter({
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
		securityTargetOrigin,
		securityFetch,
		jwtSecret,
	}));
	app.use(notFound);
	app.use(errorHandler);

	return app;
}

export default createApp();