const sensitiveKey = /password|secret|token|authorization|cookie|credential|email|phone|address|student|personal/i;
const sensitiveText = [
	/\bBearer\s+[A-Za-z0-9._~-]+/gi,
	/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
	/\bmongodb(?:\+srv)?:\/\/[^\s]+/gi,
	/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
	/\b\+?\d[\d\s().-]{7,}\d\b/g,
];

export function sanitizeEvidence(value) {
	if (Array.isArray(value)) return value.map(sanitizeEvidence);
	if (value && typeof value === 'object') {
		return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [
			key,
			sensitiveKey.test(key) ? '[REDACTED]' : sanitizeEvidence(nestedValue),
		]));
	}
	if (typeof value === 'string') {
		return sensitiveText.reduce((text, pattern) => text.replace(pattern, '[REDACTED]'), value);
	}
	return value;
}