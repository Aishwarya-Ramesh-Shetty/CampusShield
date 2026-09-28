import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { studentService } from '../services/studentService.js';

export default function StudentMarksPage() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMarks() {
      try {
        setLoading(true);
        const result = await studentService.getMarks();
        setMarks(result.data || []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load marks.');
      } finally {
        setLoading(false);
      }
    }

    void loadMarks();
  }, []);

  if (loading) return <PageShell eyebrow="Student" title="Marks"><p className="text-sm text-slate-600">Loading marks...</p></PageShell>;
  if (error) return <PageShell eyebrow="Student" title="Marks"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;

  const totalSubjects = marks.length;
  const averageMarks = totalSubjects ? marks.reduce((sum, mark) => sum + Number(mark.totalMarks || 0), 0) / totalSubjects : 0;
  const overallPercentage = totalSubjects ? Math.round((averageMarks / 100) * 100) : 0;

  return (
    <PageShell eyebrow="Student" title="Marks">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Total subjects</p><p className="mt-2 text-3xl font-semibold">{totalSubjects}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Average marks</p><p className="mt-2 text-3xl font-semibold">{averageMarks.toFixed(1)}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-600">Overall percentage</p><p className="mt-2 text-3xl font-semibold">{overallPercentage}%</p></div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Subject Code</th>
                <th className="px-4 py-3 font-medium">Internal</th>
                <th className="px-4 py-3 font-medium">External</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Semester</th>
              </tr>
            </thead>
            <tbody>
              {marks.length ? marks.map((mark) => (
                <tr key={`${mark.subjectCode}-${mark.semester}`} className="border-t border-slate-200">
                  <td className="px-4 py-3">{mark.subject}</td>
                  <td className="px-4 py-3">{mark.subjectCode}</td>
                  <td className="px-4 py-3">{mark.internalMarks}</td>
                  <td className="px-4 py-3">{mark.externalMarks}</td>
                  <td className="px-4 py-3 font-medium">{mark.totalMarks}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">{mark.grade}</span></td>
                  <td className="px-4 py-3">{mark.semester}</td>
                </tr>
              )) : <tr><td colSpan="7" className="px-4 py-4 text-slate-500">No marks records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
