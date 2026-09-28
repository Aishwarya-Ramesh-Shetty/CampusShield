const severityClasses = {
  Critical: 'border-red-300 bg-red-50 text-red-800',
  High: 'border-orange-300 bg-orange-50 text-orange-800',
  Medium: 'border-amber-300 bg-amber-50 text-amber-800',
  Low: 'border-sky-300 bg-sky-50 text-sky-800',
  Informational: 'border-slate-300 bg-slate-100 text-slate-700',
};

const statusClasses = {
  completed: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  running: 'border-blue-300 bg-blue-50 text-blue-800',
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  failed: 'border-red-300 bg-red-50 text-red-800',
  PASS: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  FAIL: 'border-red-300 bg-red-50 text-red-800',
  ERROR: 'border-orange-300 bg-orange-50 text-orange-800',
  SKIPPED: 'border-slate-300 bg-slate-100 text-slate-700',
  Open: 'border-orange-300 bg-orange-50 text-orange-800',
  Resolved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  Accepted: 'border-slate-300 bg-slate-100 text-slate-700',
};

function Badge({ value, className }) {
  return <span className={`inline-flex max-w-full items-center rounded border px-2 py-1 text-xs font-semibold leading-4 ${className || 'border-slate-300 bg-slate-100 text-slate-700'}`}>{value || 'Unknown'}</span>;
}

export function SeverityBadge({ severity, count }) {
  const value = count === undefined ? severity : `${severity} ${count}`;
  return <Badge value={value} className={severityClasses[severity]} />;
}

export function StatusBadge({ status }) {
  return <Badge value={status} className={statusClasses[status]} />;
}