import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { SeverityBadge, StatusBadge } from '../components/SecurityBadges.jsx';
import { securityService } from '../services/securityService.js';

function formatDate(value) {
  if (!value) return 'Not completed';
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Not available' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function ScanHistory({ scans }) {
  if (!scans.length) return <p className="border-y border-slate-200 py-6 text-sm text-slate-600">No scans have been run yet.</p>;
  return (
    <div className="overflow-x-auto border-y border-slate-200">
      <table className="min-w-[55rem] w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr><th className="px-3 py-3">Scan ID</th><th className="px-3 py-3">Target</th><th className="px-3 py-3">Started</th><th className="px-3 py-3">Completed</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Tests</th><th className="px-3 py-3">Findings</th></tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr className="border-t border-slate-200" key={scan.scanId}>
              <td className="px-3 py-3"><Link className="font-semibold text-teal-800 hover:underline" to={`/security/scans/${encodeURIComponent(scan.scanId)}`}>{scan.scanId}</Link></td>
              <td className="px-3 py-3 text-slate-700">{scan.target}</td>
              <td className="px-3 py-3 text-slate-600">{formatDate(scan.startedAt)}</td>
              <td className="px-3 py-3 text-slate-600">{formatDate(scan.completedAt)}</td>
              <td className="px-3 py-3"><StatusBadge status={scan.status} /></td>
              <td className="px-3 py-3 font-semibold tabular-nums">{scan.securityScore ?? '—'}</td>
              <td className="px-3 py-3 tabular-nums">{scan.passedTests}/{scan.totalTests}</td>
              <td className="px-3 py-3">
                <div className="flex min-w-44 flex-wrap gap-1">
                  {scan.criticalCount > 0 && <SeverityBadge severity="Critical" count={scan.criticalCount} />}
                  {scan.highCount > 0 && <SeverityBadge severity="High" count={scan.highCount} />}
                  {scan.mediumCount > 0 && <SeverityBadge severity="Medium" count={scan.mediumCount} />}
                  {scan.lowCount > 0 && <SeverityBadge severity="Low" count={scan.lowCount} />}
                  {scan.totalFindings === 0 && <span className="text-slate-500">None</span>}
                </div>
                <span className="sr-only">{scan.totalFindings} total findings</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TestResult({ result }) {
  return (
    <article className="grid gap-4 border-b border-slate-200 py-4 md:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900">{result.testName}</h3><StatusBadge status={result.status} /><SeverityBadge severity={result.severity} /></div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{result.description}</p>
        <p className="mt-2 font-mono text-xs text-slate-600">{result.method} {result.endpoint}</p>
        {result.evidence && <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">{JSON.stringify(result.evidence, null, 2)}</pre>}
      </div>
      <p className="text-xs tabular-nums text-slate-500">{result.duration} ms</p>
    </article>
  );
}

export default function SecurityScansPage() {
  const { scanId } = useParams();
  const [scans, setScans] = useState([]);
  const [scan, setScan] = useState(null);
  const [results, setResults] = useState([]);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const load = scanId
      ? Promise.all([securityService.getScan(scanId), securityService.getScanResults(scanId), securityService.getScanFindings(scanId)])
        .then(([scanResponse, resultsResponse, findingResponse]) => {
          if (!active) return;
          setScan(scanResponse.data);
          setResults(resultsResponse.data);
          setFindings(findingResponse.data);
        })
      : securityService.getScans().then((response) => { if (active) setScans(response.data); });

    load.catch((requestError) => { if (active) setError(requestError.message || 'Unable to load scan records.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scanId]);

  if (scanId) {
    return (
      <PageShell eyebrow="Controlled Security Assessment" title="Scan detail" actions={<Link className="text-sm font-semibold text-teal-800 hover:underline" to="/security/scans">Back to scan history</Link>}>
        {loading ? <p className="text-sm text-slate-600" role="status">Loading scan record…</p> : error ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : scan && (
          <>
            <div className="grid gap-5 border-y border-slate-200 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
              <div><p className="break-all font-mono text-sm text-slate-600">{scan.scanId}</p><h2 className="mt-2 text-xl font-semibold">{scan.target}</h2><p className="mt-2 text-sm text-slate-600">Started {formatDate(scan.startedAt)} · Completed {formatDate(scan.completedAt)}</p></div>
              <div className="flex flex-wrap items-center gap-3 md:justify-end"><StatusBadge status={scan.status} /><span className="text-2xl font-bold tabular-nums">{scan.securityScore} / 100</span></div>
            </div>
            <div className="grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-4">
              {[['Tests', scan.totalTests], ['Passed', scan.passedTests], ['Failed', scan.failedTests], ['Findings', scan.totalFindings]].map(([label, value]) => <div className="bg-white p-4" key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>)}
            </div>
            <section><h2 className="text-lg font-semibold text-slate-900">Security test results</h2>{results.length ? results.map((result) => <TestResult key={result._id || result.testId} result={result} />) : <p className="border-b border-slate-200 py-4 text-sm text-slate-600">This scan has no test results.</p>}</section>
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Findings</h2>
              {findings.length ? <div className="mt-3 space-y-3">{findings.map((finding) => <Link className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-200 py-3 hover:bg-slate-50" key={finding._id} to={`/security/findings/${encodeURIComponent(finding._id)}`}><span className="font-medium text-slate-900">{finding.title}</span><SeverityBadge severity={finding.severity} /></Link>)}</div> : <p className="mt-3 border-y border-slate-200 py-4 text-sm text-slate-600">No vulnerability findings were generated for this scan.</p>}
            </section>
          </>
        )}
      </PageShell>
    );
  }

  return <PageShell eyebrow="Controlled Security Assessment" title="Scan history"><p className="text-sm leading-6 text-slate-600">Assessment runs target only the fixed Local College Portal. Results are retained as individual security tests and findings.</p>{loading ? <p className="text-sm text-slate-600" role="status">Loading scan history…</p> : error ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : <ScanHistory scans={scans} />}</PageShell>;
}