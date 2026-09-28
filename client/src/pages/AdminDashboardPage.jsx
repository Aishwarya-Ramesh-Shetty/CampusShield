import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { adminService } from '../services/adminService.js';

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const result = await adminService.getDashboard();
        setDashboard(result.data);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load the admin dashboard.');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) return <PageShell eyebrow="Admin" title="Dashboard"><p className="text-sm text-slate-600">Loading admin overview...</p></PageShell>;
  if (error) return <PageShell eyebrow="Admin" title="Dashboard"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;
  if (!dashboard) return <PageShell eyebrow="Admin" title="Dashboard"><div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No dashboard data available.</div></PageShell>;

  return (
    <PageShell eyebrow="Admin" title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total students" value={dashboard.totalStudents ?? 0} detail="Registered learners" accent="teal" />
        <StatCard label="Active notices" value={dashboard.totalActiveNotices ?? 0} detail="Currently published" accent="blue" />
        <StatCard label="Recent students" value={dashboard.recentStudents?.length ?? 0} detail="Latest enrollments" accent="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent students</h2>
          <div className="mt-4 space-y-3">
            {dashboard.recentStudents?.length ? dashboard.recentStudents.map((student) => (
              <div key={student._id || student.studentId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.studentId}</p>
                </div>
                <span className="text-xs font-medium text-slate-600">{student.course}</span>
              </div>
            )) : <p className="text-sm text-slate-500">No students found.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent notices</h2>
          <div className="mt-4 space-y-3">
            {dashboard.recentNotices?.length ? dashboard.recentNotices.map((notice) => (
              <div key={notice._id || notice.title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-medium text-slate-900">{notice.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-teal-700">{notice.category}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No notices available.</p>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
