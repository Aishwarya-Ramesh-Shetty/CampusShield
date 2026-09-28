import mongoose from 'mongoose';

export const SECURITY_TEST_STATUSES = ['PASS', 'FAIL', 'ERROR', 'SKIPPED'];
export const SECURITY_SEVERITIES = ['Critical', 'High', 'Medium', 'Low', 'Informational'];

const securityTestResultSchema = new mongoose.Schema(
	{
		scan: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityScan', required: true, index: true },
		testId: { type: String, required: true },
		testName: { type: String, required: true },
		category: { type: String, required: true },
		description: { type: String, required: true },
		status: { type: String, enum: SECURITY_TEST_STATUSES, required: true },
		severity: { type: String, enum: SECURITY_SEVERITIES, required: true },
		endpoint: { type: String, default: '' },
		method: { type: String, default: '' },
		evidence: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
		duration: { type: Number, min: 0, required: true },
		executedAt: { type: Date, default: Date.now, required: true },
	},
	{ timestamps: true },
);

securityTestResultSchema.index({ scan: 1, executedAt: 1 });

const SecurityTestResult = mongoose.model('SecurityTestResult', securityTestResultSchema);

export default SecurityTestResult;