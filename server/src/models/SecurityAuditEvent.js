import mongoose from 'mongoose';

export const SECURITY_AUDIT_ACTIONS = ['SCAN_STARTED', 'SCAN_COMPLETED', 'SCAN_FAILED'];

const securityAuditEventSchema = new mongoose.Schema({
	assessor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	scan: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityScan', required: true, index: true },
	action: { type: String, enum: SECURITY_AUDIT_ACTIONS, required: true },
	timestamp: { type: Date, default: Date.now, required: true },
});

securityAuditEventSchema.index({ scan: 1, timestamp: 1 });

const SecurityAuditEvent = mongoose.model('SecurityAuditEvent', securityAuditEventSchema);

export default SecurityAuditEvent;