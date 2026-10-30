import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/admin',                label: 'Dashboard',     icon: '📊', end: true },
  { to: '/admin/map',            label: 'Map View',       icon: '🗺️' },
  { to: '/admin/command-center', label: 'Command Center', icon: '🎛️' },
  { to: '/admin/alerts',         label: 'Alerts',         icon: '🔔' },
  { to: '/admin/employees',      label: 'Employees',      icon: '👥' },
  { to: '/admin/tasks',          label: 'Tasks',          icon: '✅' },
  { to: '/admin/analytics',      label: 'Analytics',      icon: '📈' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-xl font-bold text-green-400">♻️ SmartWaste</span>
        <p className="text-xs text-gray-500 mt-1">Admin Portal</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-1">ADMIN</p>
        <p className="text-sm font-semibold truncate">{user?.name}</p>
        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-3 w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          ← Sign out
        </button>
      </div>
    </aside>
  );
}
