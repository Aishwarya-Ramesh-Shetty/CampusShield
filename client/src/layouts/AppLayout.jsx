import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const studentNavigation = [
  { to: '/student', label: 'Dashboard' },
  { to: '/student/profile', label: 'Profile' },
  { to: '/student/marks', label: 'Marks' },
  { to: '/student/attendance', label: 'Attendance' },
  { to: '/student/fees', label: 'Fees' },
  { to: '/student/notices', label: 'Notices' },
];

const adminNavigation = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/notices', label: 'Notices' },
];

const assessorNavigation = [
  { to: '/security', label: 'Assessment', end: true },
  { to: '/security/scans', label: 'Scan history' },
  { to: '/security/findings', label: 'Findings' },
];

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

  const navItems = user?.role === 'student' ? studentNavigation : user?.role === 'admin' ? adminNavigation : user?.role === 'security_assessor' ? assessorNavigation : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <NavLink className="text-lg font-semibold tracking-tight" to={user ? (user.role === 'student' ? '/student' : user.role === 'admin' ? '/admin' : '/security') : '/login'}>
            College Portal <span className="font-normal text-slate-500">| Security Lab</span>
          </NavLink>
          <nav aria-label="Main navigation" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {user ? navItems.map(({ to, label, end }) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-950'
                }
                end={end}
                key={to}
                to={to}
              >
                {label}
              </NavLink>
            )) : (
              <>
                <NavLink className={({ isActive }) => isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-950'} to="/login">Sign in</NavLink>
                <NavLink className={({ isActive }) => isActive ? 'font-semibold text-teal-800' : 'text-slate-600 hover:text-slate-950'} to="/register">Register</NavLink>
              </>
            )}
            {user && <button className="font-medium text-slate-600 hover:text-slate-950" onClick={() => void handleLogout()} type="button">Logout</button>}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        {logoutError && <p className="mb-5 text-sm text-red-700" role="alert">{logoutError}</p>}
        <Outlet />
      </main>
    </div>
  );
}