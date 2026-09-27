import { useAuth } from '../context/AuthContext.jsx';

export default function StudentPage() {
  const { user } = useAuth();
  return (
    <section aria-labelledby="page-title" className="max-w-2xl">
      <p className="text-sm font-medium text-teal-800">College Portal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight" id="page-title">Student Portal</h1>
      <p className="mt-3 leading-7 text-slate-600">Welcome, {user.name}. Student portal features will be added in a later phase.</p>
    </section>
  );
}