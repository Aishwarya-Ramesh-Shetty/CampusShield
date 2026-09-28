export default function StatCard({ label, value, detail, accent = 'teal' }) {
  const accentClasses = {
    teal: 'bg-teal-50 text-teal-900 border-teal-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    rose: 'bg-rose-50 text-rose-900 border-rose-200',
    slate: 'bg-slate-100 text-slate-900 border-slate-200',
  };

  return (
    <div className={`rounded-xl border p-5 ${accentClasses[accent] ?? accentClasses.teal}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {detail ? <p className="mt-2 text-sm opacity-80">{detail}</p> : null}
    </div>
  );
}
