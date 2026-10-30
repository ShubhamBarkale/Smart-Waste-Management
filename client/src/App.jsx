import { Routes, Route, Navigate } from 'react-router-dom';

// Auth
import ProtectedRoute from './components/ProtectedRoute';
import RoleRouter     from './components/RoleRouter';

// ── Admin shell ──────────────────────────────────────────
import Layout       from './components/Layout';
import Dashboard    from './pages/Dashboard';
import MapView      from './pages/MapView';
import Alerts       from './pages/Alerts';
import Tasks        from './pages/Tasks';
import Analytics    from './pages/Analytics';
import CommandCenter from './pages/CommandCenter';
import Employees    from './pages/Employees';

// ── Employee shell ───────────────────────────────────────
import EmployeeLayout    from './components/EmployeeLayout';
import EmployeeDashboard from './pages/emp/EmployeeDashboard';
import MyTasks           from './pages/emp/MyTasks';
import BinScanner        from './pages/emp/BinScanner';
import EmployeeProfile   from './pages/emp/EmployeeProfile';

// ── Auth pages ───────────────────────────────────────────
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      {/* ── Public ──────────────────────────────────────── */}
      <Route path="/login" element={<Login />} />

      {/* ── Root redirect based on role ─────────────────── */}
      <Route path="/" element={<RoleRouter />} />

      {/* ── Admin routes  /admin/* ───────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin"                element={<Dashboard />} />
          <Route path="/admin/map"            element={<MapView />} />
          <Route path="/admin/tasks"          element={<Tasks />} />
          <Route path="/admin/analytics"      element={<Analytics />} />
          <Route path="/admin/alerts"         element={<Alerts />} />
          <Route path="/admin/command-center" element={<CommandCenter />} />
          <Route path="/admin/employees"      element={<Employees />} />
        </Route>
      </Route>

      {/* ── Employee routes  /emp/* ──────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<EmployeeLayout />}>
          <Route path="/emp"         element={<EmployeeDashboard />} />
          <Route path="/emp/tasks"   element={<MyTasks />} />
          <Route path="/emp/scanner" element={<BinScanner />} />
          <Route path="/emp/profile" element={<EmployeeProfile />} />
        </Route>
      </Route>

      {/* ── Fallback ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
