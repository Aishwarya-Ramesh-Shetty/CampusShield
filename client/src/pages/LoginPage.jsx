import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getRolePath } from '../components/ProtectedRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { user, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const notice = location.state?.message;

  if (!authLoading && user) return <Navigate to={getRolePath(user.role)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const authenticatedUser = await login({ email, password });
      navigate(location.state?.from || getRolePath(authenticatedUser.role), { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby="page-title" className="max-w-md">
      <p className="text-sm font-medium text-teal-800">College Portal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight" id="page-title">Sign in</h1>
      {notice && <p className="mt-4 text-sm text-emerald-800" role="status">{notice}</p>}
      <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium" htmlFor="email">Email
          <input autoComplete="email" className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-normal" id="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label className="block text-sm font-medium" htmlFor="password">Password
          <input autoComplete="current-password" className="mt-2 block w-full rounded border border-slate-300 bg-white px-3 py-2.5 font-normal" id="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button className="rounded bg-teal-800 px-4 py-2.5 font-medium text-white hover:bg-teal-900 disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">New to the portal? <Link className="font-medium text-teal-800 underline" to="/register">Create a student account</Link></p>
    </section>
  );
}