import mongoose from 'mongoose';

export const SECURITY_SCAN_STATUSES = ['pending', 'running', 'completed', 'failed'];
export const CONTROLLED_TARGET = 'Local College Portal';

const securityScanSchema = new mongoose.Schema(
	{
		scanId: { type: String, required: true, unique: true, index: true },
		startedAt: { type: Date, default: Date.now, required: true },
		completedAt: { type: Date, default: null },
		status: { type: String, enum: SECURITY_SCAN_STATUSES, default: 'pending', required: true },
		target: { type: String, enum: [CONTROLLED_TARGET], default: CONTROLLED_TARGET, required: true },
		initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		totalTests: { type: Number, default: 0, min: 0 },
		passedTests: { type: Number, default: 0, min: 0 },
		failedTests: { type: Number, default: 0, min: 0 },
		totalFindings: { type: Number, default: 0, min: 0 },
		criticalCount: { type: Number, default: 0, min: 0 },
		highCount: { type: Number, default: 0, min: 0 },
		mediumCount: { type: Number, default: 0, min: 0 },
		lowCount: { type: Number, default: 0, min: 0 },
		informationalCount: { type: Number, default: 0, min: 0 },
		securityScore: { type: Number, default: 100, min: 0, max: 100 },
	},
	{ timestamps: true },
);

const SecurityScan = mongoose.model('SecurityScan', securityScanSchema);

export default SecurityScan;