import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { adminService } from '../services/adminService.js';

export default function AdminStudentDetailPage() {
  const { studentId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const result = await adminService.getStudentById(studentId);
        setDetail(result.data);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load student details.');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) {
      void loadDetail();
    }
  }, [studentId]);

  if (loading) return <PageShell eyebrow="Admin" title="Student details"><p className="text-sm text-slate-600">Loading student information...</p></PageShell>;
  if (error) return <PageShell eyebrow="Admin" title="Student details"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;
  if (!detail) return <PageShell eyebrow="Admin" title="Student details"><div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Student details not available.</div></PageShell>;

  const { student, marks = [], attendance = [], fees = [] } = detail;

  return (
    <PageShell eyebrow="Admin" title={student.name}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Student ID</p><p className="mt-2 font-semibold">{student.studentId}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Course</p><p className="mt-2 font-semibold">{student.course}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Department</p><p className="mt-2 font-semibold">{student.department}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Semester</p><p className="mt-2 font-semibold">{student.semester}</p></div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ['Email', student.email],
              ['Phone', student.phone],
              ['Year', student.year],
              ['Division', student.division],
              ['Admission year', student.admissionYear],
              ['Address', student.address],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 font-medium text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Marks</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700"><tr><th className="px-3 py-2 font-medium">Subject</th><th className="px-3 py-2 font-medium">Total</th><th className="px-3 py-2 font-medium">Grade</th></tr></thead>
              <tbody>{marks.length ? marks.map((mark) => <tr key={`${mark.subjectCode}-${mark.semester}`} className="border-t border-slate-200"><td className="px-3 py-2">{mark.subject}</td><td className="px-3 py-2">{mark.totalMarks}</td><td className="px-3 py-2">{mark.grade}</td></tr>) : <tr><td colSpan="3" className="px-3 py-2 text-slate-500">No marks found.</td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Attendance</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700"><tr><th className="px-3 py-2 font-medium">Subject</th><th className="px-3 py-2 font-medium">% Att</th><th className="px-3 py-2 font-medium">Classes</th></tr></thead>
              <tbody>{attendance.length ? attendance.map((item) => <tr key={`${item.subjectCode}-${item.semester}`} className="border-t border-slate-200"><td className="px-3 py-2">{item.subject}</td><td className="px-3 py-2">{item.attendancePercentage}%</td><td className="px-3 py-2">{item.attendedClasses}/{item.totalClasses}</td></tr>) : <tr><td colSpan="3" className="px-3 py-2 text-slate-500">No attendance found.</td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Fees</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700"><tr><th className="px-3 py-2 font-medium">Academic year</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Pending</th></tr></thead>
              <tbody>{fees.length ? fees.map((fee) => <tr key={`${fee.academicYear}-${fee.semester}`} className="border-t border-slate-200"><td className="px-3 py-2">{fee.academicYear}</td><td className="px-3 py-2">{fee.paymentStatus}</td><td className="px-3 py-2">₹{fee.pendingAmount}</td></tr>) : <tr><td colSpan="3" className="px-3 py-2 text-slate-500">No fee information.</td></tr>}</tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
