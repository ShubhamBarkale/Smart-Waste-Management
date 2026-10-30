import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner size="lg" />;

  // Not logged in → login page
  if (!user) return <Navigate to="/login" replace />;

  // Role not allowed → send to their own home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/emp'} replace />;
  }

  return <Outlet />;
}
