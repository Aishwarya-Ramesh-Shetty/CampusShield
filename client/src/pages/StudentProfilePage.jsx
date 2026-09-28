import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell.jsx';
import { studentService } from '../services/studentService.js';

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const result = await studentService.getProfile();
        setProfile(result.data);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  if (loading) {
    return <PageShell eyebrow="Student" title="Profile"><p className="text-sm text-slate-600">Loading profile details...</p></PageShell>;
  }

  if (error) {
    return <PageShell eyebrow="Student" title="Profile"><div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></PageShell>;
  }

  if (!profile) {
    return <PageShell eyebrow="Student" title="Profile"><div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">No profile information found.</div></PageShell>;
  }

  const fields = [
    ['Name', profile.name],
    ['Student ID', profile.studentId],
    ['Email', profile.email],
    ['Course', profile.course],
    ['Department', profile.department],
    ['Year', profile.year],
    ['Semester', profile.semester],
    ['Division', profile.division],
    ['Phone', profile.phone],
    ['Admission year', profile.admissionYear],
  ];

  return (
    <PageShell eyebrow="Student" title="Profile">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-base font-medium text-slate-900">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
