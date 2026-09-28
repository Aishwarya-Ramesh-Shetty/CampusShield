import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import StatCard from '../components/StatCard.jsx';
import { studentService } from '../services/studentService.js';

export default function StudentDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const result = await studentService.getDashboard();
        setDashboard(result.data);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load the dashboard.');
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, []);

  if (loading) {
    return <PageShell eyebrow="Student" title="Dashboard"><p className="text-sm text-slate-600">Loading your academic summary...</p></PageShell>;
  }

  if (error) {
    return <PageShell eyebrow="Student" title="Dashboard"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;
  }

  if (!dashboard) {
    return <PageShell eyebrow="Student" title="Dashboard"><div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No student data is available yet.</div></PageShell>;
  }

  const { profile, marks = [], attendance = [], fees = [], notices = [] } = dashboard;
  const attendanceSummary = attendance.length ? Math.round(attendance.reduce((total, item) => total + Number(item.attendancePercentage || 0), 0) / attendance.length) : 0;
  const recentMarks = marks.slice(0, 3);
  const feeSummary = fees[0] ? fees[0] : null;

  return (
    <PageShell eyebrow="Student" title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Student" value={profile.name} detail={profile.studentId} accent="teal" />
        <StatCard label="Current Semester" value={`Sem ${profile.semester}`} detail={profile.course} accent="blue" />
        <StatCard label="Attendance" value={`${attendanceSummary}%`} detail="Average across subjects" accent="amber" />
        <StatCard label="Fee Status" value={feeSummary ? feeSummary.paymentStatus : 'N/A'} detail={feeSummary ? `${feeSummary.pendingAmount} pending` : 'No fee record'} accent="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent marks</h2>
          <div className="mt-4 space-y-3">
            {recentMarks.length ? recentMarks.map((mark) => (
              <div key={`${mark.subjectCode}-${mark.semester}`} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-800">{mark.subject}</p>
                  <p className="text-xs text-slate-500">{mark.subjectCode}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{mark.totalMarks}</p>
                  <p className="text-xs text-slate-500">Grade {mark.grade}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No marks available.</p>}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Notice board</h2>
          <div className="mt-4 space-y-3">
            {notices.length ? notices.slice(0, 3).map((notice) => (
              <div key={notice._id || notice.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{notice.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-teal-700">{notice.category}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No active notices.</p>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
