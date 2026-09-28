import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { studentService } from '../services/studentService.js';

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAttendance() {
      try {
        setLoading(true);
        const result = await studentService.getAttendance();
        setAttendance(result.data || []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load attendance.');
      } finally {
        setLoading(false);
      }
    }

    void loadAttendance();
  }, []);

  if (loading) return <PageShell eyebrow="Student" title="Attendance"><p className="text-sm text-slate-600">Loading attendance details...</p></PageShell>;
  if (error) return <PageShell eyebrow="Student" title="Attendance"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;

  return (
    <PageShell eyebrow="Student" title="Attendance">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Total classes</th>
                <th className="px-4 py-3 font-medium">Attended</th>
                <th className="px-4 py-3 font-medium">Attendance %</th>
                <th className="px-4 py-3 font-medium">Semester</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length ? attendance.map((item) => (
                <tr key={`${item.subjectCode}-${item.semester}`} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.subject}</td>
                  <td className="px-4 py-3">{item.totalClasses}</td>
                  <td className="px-4 py-3">{item.attendedClasses}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${Number(item.attendancePercentage) >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {item.attendancePercentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.semester}</td>
                </tr>
              )) : <tr><td colSpan="5" className="px-4 py-4 text-slate-500">No attendance records available.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
