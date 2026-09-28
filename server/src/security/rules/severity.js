export const severityWeights = Object.freeze({
	Critical: 25,
	High: 15,
	Medium: 8,
	Low: 3,
	Informational: 0,
});

export function calculateSecurityScore(findings = []) {
	const deduction = findings.reduce((total, finding) => total + (severityWeights[finding.severity] ?? 0), 0);
	return Math.max(0, 100 - deduction);
}

export function countFindingsBySeverity(findings = []) {
	return findings.reduce((counts, finding) => {
		if (finding.severity === 'Critical') counts.criticalCount += 1;
		if (finding.severity === 'High') counts.highCount += 1;
		if (finding.severity === 'Medium') counts.mediumCount += 1;
		if (finding.severity === 'Low') counts.lowCount += 1;
		if (finding.severity === 'Informational') counts.informationalCount += 1;
		return counts;
	}, { criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0, informationalCount: 0 });
}