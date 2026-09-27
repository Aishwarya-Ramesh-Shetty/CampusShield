import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', studentId: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/login', { replace: true, state: { message: 'Account created. Sign in to continue.' } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="page-title" className="max-w-md">
      <p className="text-sm font-medium text-teal-800">College Portal Security Assessment</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight" id="page-title">Register</h1>
      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium" htmlFor="name">Name
          <input autoComplete="name" className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-normal" id="name" maxLength={100} minLength={2} name="name" onChange={updateField} required value={form.name} />
        </label>
        <label className="block text-sm font-medium" htmlFor="email">Email
          <input autoComplete="email" className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-normal" id="email" name="email" onChange={updateField} required type="email" value={form.email} />
        </label>
        <label className="block text-sm font-medium" htmlFor="password">Password
          <input autoComplete="new-password" className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-normal" id="password" minLength={12} name="password" onChange={updateField} required type="password" value={form.password} />
        </label>
        <label className="block text-sm font-medium" htmlFor="studentId">Student ID
          <input className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-normal" id="studentId" maxLength={40} name="studentId" onChange={updateField} required value={form.studentId} />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button className="rounded bg-teal-800 px-4 py-2.5 font-medium text-white hover:bg-teal-900 disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">Already registered? <Link className="font-medium text-teal-800 underline" to="/login">Sign in</Link></p>
    </section>
  );
}