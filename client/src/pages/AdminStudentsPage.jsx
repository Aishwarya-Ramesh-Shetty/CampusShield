import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell.jsx';
import { adminService } from '../services/adminService.js';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        const result = await adminService.getStudents();
        setStudents(result.data?.students || []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load students.');
      } finally {
        setLoading(false);
      }
    }

    void loadStudents();
  }, []);

  if (loading) return <PageShell eyebrow="Admin" title="Students"><p className="text-sm text-slate-600">Loading student records...</p></PageShell>;
  if (error) return <PageShell eyebrow="Admin" title="Students"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;

  return (
    <PageShell eyebrow="Admin" title="Students">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Student ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Year</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length ? students.map((student) => (
                <tr key={student._id || student.studentId} className="border-t border-slate-200">
                  <td className="px-4 py-3">{student.studentId}</td>
                  <td className="px-4 py-3">{student.name}</td>
                  <td className="px-4 py-3">{student.email}</td>
                  <td className="px-4 py-3">{student.course}</td>
                  <td className="px-4 py-3">{student.department}</td>
                  <td className="px-4 py-3">{student.year}</td>
                  <td className="px-4 py-3"><Link className="font-medium text-teal-700 hover:text-teal-900" to={`/admin/students/${student._id}`}>View</Link></td>
                </tr>
              )) : <tr><td colSpan="7" className="px-4 py-4 text-slate-500">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
