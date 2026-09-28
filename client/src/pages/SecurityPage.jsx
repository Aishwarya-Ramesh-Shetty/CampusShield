import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { securityService } from '../services/securityService.js';
import { StatusBadge } from '../components/SecurityBadges.jsx';

const metrics = [
  { key: 'totalScans', label: 'Total scans', tone: 'border-l-teal-600' },
  { key: 'totalTests', label: 'Tests executed', tone: 'border-l-blue-600' },
  { key: 'passedTests', label: 'Passed', tone: 'border-l-emerald-600' },
  { key: 'failedTests', label: 'Failed or errored', tone: 'border-l-orange-600' },
  { key: 'criticalFindings', label: 'Critical findings', tone: 'border-l-red-700' },
  { key: 'highFindings', label: 'High findings', tone: 'border-l-orange-600' },
  { key: 'mediumFindings', label: 'Medium findings', tone: 'border-l-amber-600' },
  { key: 'lowFindings', label: 'Low findings', tone: 'border-l-sky-600' },
];

function formatDate(value) {
  if (!value) return 'Not run yet';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export default function SecurityPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([securityService.getDashboard(), securityService.getScans()])
      .then(([summary, scans]) => {
        if (!active) return;
        setDashboard(summary.data);
        setRecentScans(scans.data.slice(0, 5));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load the assessment dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleRunScan() {
    setRunning(true);
    setError('');
    try {
      const result = await securityService.startScan();
      navigate(`/security/scans/${encodeURIComponent(result.data.scanId)}`);
    } catch (requestError) {
      setError(requestError.message || 'The controlled security scan could not be completed.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <PageShell
      eyebrow="Controlled Security Assessment"
      title="Local College Portal"
      actions={(
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-teal-900 bg-teal-900 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-wait disabled:opacity-60" disabled={running || loading} onClick={() => void handleRunScan()} type="button">
          <span aria-hidden="true">{running ? '…' : '+'}</span>
          {running ? 'Running security scan' : 'Run Security Scan'}
        </button>
      )}
    >
      <div className="flex flex-col gap-4 border-y border-slate-300 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fixed assessment target</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">Local College Portal</p>
        </div>
        <div className="max-w-xl border-l-2 border-amber-500 pl-3 text-sm leading-6 text-slate-600">
          This is a controlled academic assessment metric, not an OWASP, CVSS, or industry security rating.
        </div>
      </div>

      {error && <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</div>}
      {loading ? <p className="text-sm text-slate-600" role="status">Loading assessment data…</p> : (
        <>
          <section aria-label="Security score" className="grid gap-5 border-b border-slate-200 pb-6 lg:grid-cols-[minmax(0,1fr)_2fr]">
            <div className="flex items-center gap-5 rounded border border-slate-200 bg-white p-5">
              <div className="grid size-24 shrink-0 place-items-center rounded-full border-[7px] border-teal-700 text-3xl font-bold tabular-nums text-slate-900" aria-label={`Academic security score ${dashboard?.securityScore ?? 100} out of 100`}>
                {dashboard?.securityScore ?? 100}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Project score</p>
                <h2 className="mt-1 text-lg font-semibold">{dashboard?.securityScore ?? 100} / 100</h2>
                <p className="mt-1 text-sm text-slate-600">Based on confirmed findings only.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-4">
              {metrics.map(({ key, label, tone }) => (
                <div className={`min-h-24 border-l-4 ${tone} bg-white p-4`} key={key}>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{dashboard?.[key] ?? 0}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Recent scan history</h2>
                <Link className="text-sm font-semibold text-teal-800 hover:text-teal-950" to="/security/scans">All scans</Link>
              </div>
              {recentScans.length ? (
                <div className="overflow-x-auto border-y border-slate-200">
                  <table className="min-w-[38rem] w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="py-3 pr-4">Scan</th><th className="py-3 pr-4">Started</th><th className="py-3 pr-4">Status</th><th className="py-3">Score</th></tr>
                    </thead>
                    <tbody>
                      {recentScans.map((scan) => (
                        <tr className="border-t border-slate-200" key={scan.scanId}>
                          <td className="py-3 pr-4"><Link className="font-medium text-teal-800 hover:underline" to={`/security/scans/${encodeURIComponent(scan.scanId)}`}>{scan.scanId.slice(0, 8)}</Link></td>
                          <td className="py-3 pr-4 text-slate-600">{formatDate(scan.startedAt)}</td>
                          <td className="py-3 pr-4"><StatusBadge status={scan.status} /></td>
                          <td className="py-3 font-semibold tabular-nums">{scan.securityScore ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="border-y border-slate-200 py-5 text-sm text-slate-600">No scans yet. Run the baseline health check to establish the first assessment record.</p>}
            </div>

            <aside className="border-l-2 border-teal-700 pl-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Latest assessment</p>
              {dashboard?.latestScan ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-semibold text-slate-900">{dashboard.latestScan.scanId}</p>
                  <p className="text-slate-600">{formatDate(dashboard.latestScan.completedAt || dashboard.latestScan.startedAt)}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1"><StatusBadge status={dashboard.latestScan.status} /><Link className="font-semibold text-teal-800 hover:underline" to={`/security/scans/${encodeURIComponent(dashboard.latestScan.scanId)}`}>Review results</Link></div>
                </div>
              ) : <p className="mt-3 text-sm text-slate-600">No completed scan is available.</p>}
              <Link className="mt-5 inline-flex text-sm font-semibold text-teal-800 hover:underline" to="/security/findings">Review findings</Link>
            </aside>
          </section>
        </>
      )}
    </PageShell>
  );
}