export const portalHealthCheck = Object.freeze({
	id: 'SECURITY-BASELINE-001',
	name: 'Portal Health Check',
	category: 'Baseline',
	description: 'Verifies that the controlled local College Portal health endpoint responds successfully.',
	severity: 'Informational',
	endpoint: '/api/health',
	method: 'GET',
	remediation: 'Restore the local College Portal API service and confirm its health endpoint returns success.',
	async execute({ targetOrigin, fetchImpl }) {
		const response = await fetchImpl(new URL('/api/health', targetOrigin), {
			method: 'GET',
			redirect: 'error',
			signal: AbortSignal.timeout(5000),
		});
		const body = await response.json().catch(() => null);
		const passed = response.status === 200 && body?.success === true;
		return {
			status: passed ? 'PASS' : 'FAIL',
			evidence: {
				request: { method: 'GET', endpoint: '/api/health' },
				response: { status: response.status },
				observation: passed
					? 'The local health endpoint returned HTTP 200 with a success response.'
					: 'The local health endpoint did not return the expected success response.',
			},
		};
	},
});