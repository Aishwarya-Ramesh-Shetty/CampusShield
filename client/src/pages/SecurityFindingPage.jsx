import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { SeverityBadge, StatusBadge } from '../components/SecurityBadges.jsx';
import { securityService } from '../services/securityService.js';

function Field({ label, children }) {
  return <div className="border-b border-slate-200 py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{children || 'Not provided'}</dd></div>;
}

export default function SecurityFindingPage() {
  const { findingId } = useParams();
  const [findings, setFindings] = useState([]);
  const [finding, setFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = findingId ? securityService.getFinding(findingId) : securityService.getFindings();
    load.then((response) => {
      if (!active) return;
      if (findingId) setFinding(response.data);
      else setFindings(response.data);
    }).catch((requestError) => {
      if (active) setError(requestError.message || 'Unable to load findings.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [findingId]);

  if (findingId) {
    return (
      <PageShell eyebrow="Controlled Security Assessment" title="Finding detail" actions={<Link className="text-sm font-semibold text-teal-800 hover:underline" to="/security/findings">All findings</Link>}>
        {loading ? <p className="text-sm text-slate-600" role="status">Loading finding…</p> : error ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : finding && (
          <article>
            <header className="flex flex-col gap-3 border-y border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><SeverityBadge severity={finding.severity} /><StatusBadge status={finding.status} /></div><h2 className="mt-3 text-2xl font-semibold text-slate-900">{finding.title}</h2></div>
              {finding.scanId && <Link className="text-sm font-semibold text-teal-800 hover:underline" to={`/security/scans/${encodeURIComponent(finding.scanId)}`}>Open originating scan</Link>}
            </header>
            <dl className="divide-y divide-slate-200">
              <Field label="Category">{finding.category}</Field>
              <Field label="Vulnerability type">{finding.vulnerabilityType}</Field>
              <Field label="Description">{finding.description}</Field>
              <Field label="Impact">{finding.impact}</Field>
              <Field label="Affected endpoint">{finding.method} {finding.endpoint}</Field>
              <Field label="Evidence"><pre className="whitespace-pre-wrap break-words font-mono text-xs">{JSON.stringify(finding.evidence ?? {}, null, 2)}</pre></Field>
              <Field label="Recommendation">{finding.recommendation}</Field>
              <Field label="Remediation status">{finding.remediationStatus}</Field>
              <Field label="Discovered">{finding.discoveredAt ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(finding.discoveredAt)) : 'Not recorded'}</Field>
            </dl>
          </article>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Controlled Security Assessment" title="Findings">
      <p className="text-sm leading-6 text-slate-600">Findings are created only from failed registered security tests. The baseline health check does not create vulnerability findings.</p>
      {loading ? <p className="text-sm text-slate-600" role="status">Loading findings…</p> : error ? <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : findings.length ? (
        <div className="border-y border-slate-200">
          {findings.map((item) => <Link className="flex flex-col gap-3 border-b border-slate-200 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" key={item._id} to={`/security/findings/${encodeURIComponent(item._id)}`}><div><p className="font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.category} · {item.method} {item.endpoint}</p></div><div className="flex items-center gap-2"><SeverityBadge severity={item.severity} /><StatusBadge status={item.status} /></div></Link>)}
        </div>
      ) : <p className="border-y border-slate-200 py-6 text-sm text-slate-600">No vulnerability findings have been recorded. No fake findings are displayed.</p>}
    </PageShell>
  );
}