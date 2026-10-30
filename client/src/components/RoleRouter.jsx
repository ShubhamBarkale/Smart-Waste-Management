import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/**
 * RoleRouter — sits at "/" and redirects based on role.
 * Admin  → /admin  (existing dashboard)
 * Employee → /emp  (new employee portal)
 */
export default function RoleRouter() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner size="lg" />;
  if (!user)   return <Navigate to="/login" replace />;
  return user.role === 'admin'
    ? <Navigate to="/admin"  replace />
    : <Navigate to="/emp"    replace />;
}
