import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const TITLES = {
  '/admin':                'Dashboard',
  '/admin/map':            'Map View',
  '/admin/command-center': 'Command Center',
  '/admin/alerts':         'Alerts',
  '/admin/employees':      'Employees',
  '/admin/tasks':          'Tasks',
  '/admin/analytics':      'Analytics',
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Smart Waste';

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
