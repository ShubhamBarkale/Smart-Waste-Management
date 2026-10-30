import { useAuth } from '../context/AuthContext';
import LiveStatus from './LiveStatus';

export default function Navbar({ title = 'Dashboard' }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        <LiveStatus />
        <span className="text-sm text-gray-500">Welcome,</span>
        <span className="text-sm font-medium text-gray-800">{user?.name}</span>
        <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
          {user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      </div>
    </header>
  );
}
