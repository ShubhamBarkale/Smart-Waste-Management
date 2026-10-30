import { Outlet, useLocation } from 'react-router-dom';
import EmployeeSidebar from './EmployeeSidebar';
import LiveStatus from './LiveStatus';

const TITLES = {
  '/emp':         'My Dashboard',
  '/emp/tasks':   'My Tasks',
  '/emp/scanner': 'Bin Scanner',
  '/emp/profile': 'My Profile',
};

export default function EmployeeLayout() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Employee Portal';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <EmployeeSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <div className="flex items-center gap-3">
            <LiveStatus />
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
              Employee
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
