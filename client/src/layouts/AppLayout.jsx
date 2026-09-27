import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const navigation = [
  { to: '/student', label: 'Student Portal' },
  { to: '/admin', label: 'Admin Portal' },
  { to: '/security', label: 'Security Assessment' },
];
const roleByPath = { '/student': 'student', '/admin': 'admin', '/security': 'security_assessor' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
    } catch {
      setLogoutError('The session could not be confirmed as revoked. Please try signing out again.');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <NavLink className="text-lg font-semibold tracking-tight" to="/login">
            College Portal <span className="font-normal text-slate-500">| Security Lab</span>
          </NavLink>
          <nav aria-label="Main navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {user && navigation.filter(({ to }) => roleByPath[to] === user.role).map(({ to, label }) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-950'
                }
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            ))}
            {!user && <NavLink
              className={({ isActive }) =>
                isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-950'
              }
              to="/login"
            >
              Sign in
            </NavLink>}
            {!user && <NavLink
              className={({ isActive }) =>
                isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-950'
              }
              to="/register"
            >
              Register
            </NavLink>}
            {user && <button className="text-slate-600 hover:text-slate-950" onClick={() => void handleLogout()} type="button">Sign out</button>}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-12">
        {logoutError && <p className="mb-5 text-sm text-red-700" role="alert">{logoutError}</p>}
        <Outlet />
      </main>
    </div>
  );
}