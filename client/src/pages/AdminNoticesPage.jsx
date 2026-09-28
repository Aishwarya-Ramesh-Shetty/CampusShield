import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { adminService } from '../services/adminService.js';

const emptyForm = { title: '', description: '', category: 'Academic', expiresAt: '' };

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function loadNotices() {
    try {
      setLoading(true);
      const result = await adminService.getNotices();
      setNotices(result.data || []);
    } catch (requestError) {
      setError(requestError.message || 'Unable to load notices.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotices();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setStatus('');
    try {
      await adminService.createNotice(form);
      setStatus('Notice created successfully.');
      setForm(emptyForm);
      await loadNotices();
    } catch (requestError) {
      setError(requestError.message || 'Unable to create notice.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noticeId) {
    try {
      await adminService.deleteNotice(noticeId);
      setStatus('Notice deactivated.');
      await loadNotices();
    } catch (requestError) {
      setError(requestError.message || 'Unable to deactivate notice.');
    }
  }

  if (loading) return <PageShell eyebrow="Admin" title="Notices"><p className="text-sm text-slate-600">Loading notice management...</p></PageShell>;

  return (
    <PageShell eyebrow="Admin" title="Notices">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.7fr]">
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create notice</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Title
              <input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </label>
            <label className="block text-sm font-medium text-slate-700">Description
              <textarea className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
            </label>
            <label className="block text-sm font-medium text-slate-700">Category
              <select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Administrative">Administrative</option>
                <option value="General">General</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">Expiry date
              <input type="date" className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} />
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {status ? <p className="text-sm text-emerald-700">{status}</p> : null}
            <button type="submit" disabled={saving} className="rounded bg-teal-800 px-4 py-2.5 font-medium text-white hover:bg-teal-900 disabled:opacity-60">
              {saving ? 'Saving...' : 'Publish notice'}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Existing notices</h2>
          <div className="mt-4 space-y-3">
            {notices.length ? notices.map((notice) => (
              <div key={notice._id || notice.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{notice.title}</p>
                    <p className="text-xs uppercase tracking-wide text-teal-700">{notice.category}</p>
                  </div>
                  <button type="button" onClick={() => void handleDelete(notice._id)} className="text-sm text-red-700 hover:text-red-900">Deactivate</button>
                </div>
                <p className="mt-2 text-sm text-slate-700">{notice.description}</p>
                <p className="mt-2 text-xs text-slate-500">Status: {notice.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No notices are available.</p>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
