import { Router } from 'express';
import { createAuthenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { createSecurityTestRunner } from '../security/runners/securityTestRunner.js';

export function createSecurityRouter({
	UserModel,
	SecurityScanModel,
	SecurityTestResultModel,
	VulnerabilityFindingModel,
	SecurityAuditEventModel,
	securityTargetOrigin,
	securityFetch,
	jwtSecret,
}) {
	const router = Router();
	const authenticate = createAuthenticate({ UserModel, jwtSecret });
	const requireAssessor = requireRole('security_assessor');
	const runner = createSecurityTestRunner({
		SecurityScanModel,
		SecurityTestResultModel,
		VulnerabilityFindingModel,
		SecurityAuditEventModel,
		targetOrigin: securityTargetOrigin,
		fetchImpl: securityFetch,
	});
	async function serializeFinding(finding) {
		const scan = await SecurityScanModel.findById(finding.scan);
		const data = typeof finding.toObject === 'function' ? finding.toObject() : { ...finding };
		return { ...data, scanId: scan?.scanId ?? '' };
	}

	router.use(authenticate, requireAssessor);

	router.get('/dashboard', async (_request, response, next) => {
		try {
			const [totalScans, totalTests, passedTests, failedTests, latestScan, severityCounts] = await Promise.all([
				SecurityScanModel.countDocuments(),
				SecurityTestResultModel.countDocuments(),
				SecurityTestResultModel.countDocuments({ status: 'PASS' }),
				SecurityTestResultModel.countDocuments({ status: { $in: ['FAIL', 'ERROR'] } }),
				SecurityScanModel.findOne().sort({ startedAt: -1 }),
				Promise.all(['Critical', 'High', 'Medium', 'Low'].map((severity) => VulnerabilityFindingModel.countDocuments({ severity }))),
			]);
			return response.json({
				success: true,
				data: {
					securityScore: latestScan?.securityScore ?? 100,
					totalScans,
					latestScan,
					totalTests,
					passedTests,
					failedTests,
					criticalFindings: severityCounts[0],
					highFindings: severityCounts[1],
					mediumFindings: severityCounts[2],
					lowFindings: severityCounts[3],
				},
			});
		} catch (error) {
			return next(error);
		}
	});

	router.post('/scans', async (request, response, next) => {
		try {
			if (Object.keys(request.body ?? {}).length > 0) {
				return response.status(400).json({ success: false, message: 'Scan options are server-controlled; request fields are not accepted.' });
			}
			const scan = await runner.runScan({ initiatedBy: request.authenticatedUser._id });
			return response.status(201).json({ success: true, data: scan });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/scans', async (_request, response, next) => {
		try {
			const scans = await SecurityScanModel.find().sort({ startedAt: -1 }).limit(100);
			return response.json({ success: true, data: scans });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/scans/:scanId/results', async (request, response, next) => {
		try {
			const scan = await SecurityScanModel.findOne({ scanId: request.params.scanId });
			if (!scan) return response.status(404).json({ success: false, message: 'Scan not found.' });
			const results = await SecurityTestResultModel.find({ scan: scan._id }).sort({ executedAt: 1 });
			return response.json({ success: true, data: results });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/scans/:scanId/findings', async (request, response, next) => {
		try {
			const scan = await SecurityScanModel.findOne({ scanId: request.params.scanId });
			if (!scan) return response.status(404).json({ success: false, message: 'Scan not found.' });
			const records = await VulnerabilityFindingModel.find({ scan: scan._id }).sort({ discoveredAt: -1 });
			const findings = await Promise.all(records.map(serializeFinding));
			return response.json({ success: true, data: findings });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/scans/:scanId', async (request, response, next) => {
		try {
			const scan = await SecurityScanModel.findOne({ scanId: request.params.scanId });
			if (!scan) return response.status(404).json({ success: false, message: 'Scan not found.' });
			return response.json({ success: true, data: scan });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/findings', async (_request, response, next) => {
		try {
			const records = await VulnerabilityFindingModel.find().sort({ discoveredAt: -1 }).limit(100);
			const findings = await Promise.all(records.map(serializeFinding));
			return response.json({ success: true, data: findings });
		} catch (error) {
			return next(error);
		}
	});

	router.get('/findings/:findingId', async (request, response, next) => {
		try {
			const finding = await VulnerabilityFindingModel.findOne({ _id: request.params.findingId });
			if (!finding) return response.status(404).json({ success: false, message: 'Finding not found.' });
			return response.json({ success: true, data: await serializeFinding(finding) });
		} catch (error) {
			return next(error);
		}
	});

	return router;
}