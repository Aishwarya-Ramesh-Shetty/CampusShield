import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="text-sm text-slate-600" role="status">Checking your session...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to={getRolePath(user.role)} replace />;
  }
  return <Outlet />;
}

export function getRolePath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'security_assessor') return '/security';
  return '/student';
}