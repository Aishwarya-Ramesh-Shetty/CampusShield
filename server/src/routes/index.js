import { Router } from 'express';
import { createAdminRouter } from './admin.routes.js';
import { createAuthRouter } from './auth.routes.js';
import { createHealthRouter } from './health.routes.js';
import { createSecurityRouter } from './security.routes.js';
import { createStudentsRouter } from './students.routes.js';

export function createApiRouter({
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
}) {
	const router = Router();

	router.use('/health', createHealthRouter());
	router.use('/auth', createAuthRouter({ UserModel, jwtSecret }));
	router.use('/students', createStudentsRouter({ UserModel, StudentModel, MarkModel, AttendanceModel, FeeModel, NoticeModel, jwtSecret }));
	router.use('/admin', createAdminRouter({ UserModel, StudentModel, MarkModel, AttendanceModel, FeeModel, NoticeModel, jwtSecret }));
	router.use('/security', createSecurityRouter({
		UserModel,
		SecurityScanModel,
		SecurityTestResultModel,
		VulnerabilityFindingModel,
		SecurityAuditEventModel,
		securityTargetOrigin,
		securityFetch,
		jwtSecret,
	}));

	return router;
}