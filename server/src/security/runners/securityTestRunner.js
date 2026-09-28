import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { calculateSecurityScore, countFindingsBySeverity } from '../rules/severity.js';
import { securityTestRegistry } from '../tests/securityTestRegistry.js';
import { sanitizeEvidence } from '../utils/evidence.js';

function assertLoopbackTarget(targetOrigin) {
	const parsed = new URL(targetOrigin);
	if (parsed.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || parsed.username || parsed.password || parsed.pathname !== '/') {
		throw new TypeError('Security assessment target must be a local loopback origin.');
	}
	return parsed.origin;
}

export function createSecurityTestRunner({
	SecurityScanModel,
	SecurityTestResultModel,
	VulnerabilityFindingModel,
	SecurityAuditEventModel,
	tests = securityTestRegistry,
	fetchImpl = globalThis.fetch,
	targetOrigin = `http://127.0.0.1:${env.port}`,
}) {
	const controlledOrigin = assertLoopbackTarget(targetOrigin);

	async function recordAudit({ assessor, scan, action }) {
		await SecurityAuditEventModel.create({ assessor, scan, action });
	}

	return {
		async runScan({ initiatedBy }) {
			const scan = await SecurityScanModel.create({
				scanId: randomUUID(),
				startedAt: new Date(),
				status: 'pending',
				target: 'Local College Portal',
				initiatedBy,
				totalTests: tests.length,
			});

			try {
				await recordAudit({ assessor: initiatedBy, scan: scan._id, action: 'SCAN_STARTED' });
				scan.status = 'running';
				await scan.save();
				let passedTests = 0;
				let failedTests = 0;

				for (const test of tests) {
					const started = performance.now();
					let execution;
					try {
						execution = await test.execute({ targetOrigin: controlledOrigin, fetchImpl });
					} catch (error) {
						execution = {
							status: 'ERROR',
							evidence: { observation: `Test execution raised ${error.name || 'an error'}; details were omitted.` },
						};
					}

					const status = ['PASS', 'FAIL', 'ERROR', 'SKIPPED'].includes(execution?.status) ? execution.status : 'ERROR';
					const evidence = sanitizeEvidence(execution?.evidence ?? {});
					await SecurityTestResultModel.create({
						scan: scan._id,
						testId: test.id,
						testName: test.name,
						category: test.category,
						description: test.description,
						status,
						severity: test.severity,
						endpoint: test.endpoint,
						method: test.method,
						evidence,
						duration: Math.max(0, Math.round(performance.now() - started)),
						executedAt: new Date(),
					});

					if (status === 'PASS') passedTests += 1;
					if (status === 'FAIL' || status === 'ERROR') failedTests += 1;

					const finding = execution?.finding ?? test.finding;
					if (status === 'FAIL' && finding) {
						await VulnerabilityFindingModel.create({
							scan: scan._id,
							title: finding.title,
							vulnerabilityType: finding.vulnerabilityType,
							category: finding.category,
							severity: finding.severity,
							description: finding.description,
							impact: finding.impact,
							endpoint: finding.endpoint ?? test.endpoint,
							method: finding.method ?? test.method,
							evidence,
							recommendation: finding.recommendation,
							status: 'Open',
							remediationStatus: 'Not Fixed',
							discoveredAt: new Date(),
						});
					}
				}

				const findings = await VulnerabilityFindingModel.find({ scan: scan._id });
				const severityCounts = countFindingsBySeverity(findings);
				Object.assign(scan, {
					status: 'completed',
					completedAt: new Date(),
					totalTests: tests.length,
					passedTests,
					failedTests,
					totalFindings: findings.length,
					...severityCounts,
					securityScore: calculateSecurityScore(findings),
				});
				await scan.save();
				await recordAudit({ assessor: initiatedBy, scan: scan._id, action: 'SCAN_COMPLETED' });
				return scan;
			} catch (error) {
				scan.status = 'failed';
				scan.completedAt = new Date();
				try {
					await scan.save();
					await recordAudit({ assessor: initiatedBy, scan: scan._id, action: 'SCAN_FAILED' });
				} catch {
					// Preserve the original scan failure if failure recording also fails.
				}
				throw error;
			}
		},
	};
}