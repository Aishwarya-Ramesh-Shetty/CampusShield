import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { studentService } from '../services/studentService.js';

export default function StudentFeesPage() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadFees() {
      try {
        setLoading(true);
        const result = await studentService.getFees();
        setFees(result.data || []);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load fee records.');
      } finally {
        setLoading(false);
      }
    }

    void loadFees();
  }, []);

  if (loading) return <PageShell eyebrow="Student" title="Fees"><p className="text-sm text-slate-600">Loading fee information...</p></PageShell>;
  if (error) return <PageShell eyebrow="Student" title="Fees"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;

  return (
    <PageShell eyebrow="Student" title="Fees">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Academic year</th>
                <th className="px-4 py-3 font-medium">Semester</th>
                <th className="px-4 py-3 font-medium">Total fee</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Due date</th>
              </tr>
            </thead>
            <tbody>
              {fees.length ? fees.map((fee) => (
                <tr key={`${fee.academicYear}-${fee.semester}`} className="border-t border-slate-200">
                  <td className="px-4 py-3">{fee.academicYear}</td>
                  <td className="px-4 py-3">{fee.semester}</td>
                  <td className="px-4 py-3">₹{fee.totalAmount}</td>
                  <td className="px-4 py-3">₹{fee.paidAmount}</td>
                  <td className="px-4 py-3">₹{fee.pendingAmount}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2 py-1 text-xs font-medium bg-slate-200 text-slate-800">{fee.paymentStatus}</span></td>
                  <td className="px-4 py-3">{fee.dueDate}</td>
                </tr>
              )) : <tr><td colSpan="7" className="px-4 py-4 text-slate-500">No fees record available.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
