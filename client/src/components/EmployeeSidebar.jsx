import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ZONE_STYLE = {
  kopargaon: { label: 'Kopargaon Zone', emoji: '🏘️', color: 'text-blue-400',  dot: 'bg-blue-400'   },
  shirdi:    { label: 'Shirdi Zone',    emoji: '🛕', color: 'text-orange-400', dot: 'bg-orange-400' },
};

const navItems = [
  { to: '/emp',          label: 'My Dashboard', icon: '🏠', end: true },
  { to: '/emp/tasks',    label: 'My Tasks',     icon: '📋' },
  { to: '/emp/scanner',  label: 'Bin Scanner',  icon: '📡' },
  { to: '/emp/profile',  label: 'My Profile',   icon: '👤' },
];

export default function EmployeeSidebar() {
  const { user, logout } = useAuth();
  const zone = ZONE_STYLE[user?.zone] ?? null;

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-green-400">♻️ SmartWaste</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Employee Portal</p>
      </div>

      {/* Zone badge */}
      {zone && (
        <div className="mx-3 mt-3 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700">
          <p className="text-xs text-gray-400 mb-0.5">Assigned Zone</p>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${zone.dot} shrink-0`} />
            <span className={`text-sm font-semibold ${zone.color}`}>
              {zone.emoji} {zone.label}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
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

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'E'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          ← Sign out
        </button>
      </div>
    </aside>
  );
}
