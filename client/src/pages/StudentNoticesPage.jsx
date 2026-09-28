import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { studentService } from '../services/studentService.js';

export default function StudentNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadNotices() {
      try {
        setLoading(true);
        const result = await studentService.getNotices();
        setNotices(result.data || []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load notices.');
      } finally {
        setLoading(false);
      }
    }

    void loadNotices();
  }, []);

  if (loading) return <PageShell eyebrow="Student" title="Notices"><p className="text-sm text-slate-600">Loading notices...</p></PageShell>;
  if (error) return <PageShell eyebrow="Student" title="Notices"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;

  return (
    <PageShell eyebrow="Student" title="Notices">
      <div className="space-y-4">
        {notices.length ? notices.map((notice) => (
          <article key={notice._id || notice.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{notice.title}</h2>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-teal-700">{notice.category}</p>
              </div>
              <div className="text-sm text-slate-500">
                <span>Published {new Date(notice.publishedAt).toLocaleDateString()}</span>
                {notice.expiresAt ? <span className="ml-3">Expires {new Date(notice.expiresAt).toLocaleDateString()}</span> : null}
              </div>
            </div>
            <p className="mt-4 leading-7 text-slate-700">{notice.description}</p>
          </article>
        )) : <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No active notices are currently available.</div>}
      </div>
    </PageShell>
  );
}
