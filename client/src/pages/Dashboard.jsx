import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../context/LiveContext';
import { getAllBins } from '../services/binService';
import { getAllTasks } from '../services/taskService';
import FillBar from '../components/FillBar';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import BinDrawer from '../components/BinDrawer';
import AssignTaskModal from '../components/AssignTaskModal';

// ── Clickable stat card ───────────────────────────────────────────────────────
function ClickableStatCard({ title, value, icon, bg, border, textColor, iconBg, pulse, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left rounded-2xl border ${bg} ${border} p-5 flex items-center gap-4 shadow-sm
        hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer group`}
    >
      {pulse && (
        <span className="absolute top-3 right-3 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
      )}
      <div className={`${iconBg} p-3 rounded-xl text-2xl shrink-0`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
      </div>
      {/* Chevron hint */}
      <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-lg shrink-0">›</span>
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [bins, setBins]         = useState([]);
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Drawer state: null | 'all' | 'Critical' | 'Warning' | 'Normal' | 'pending-tasks'
  const [drawer, setDrawer]     = useState(null);
  // Assign modal state
  const [assignBin, setAssignBin] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([getAllBins(), getAllTasks()])
      .then(([b, t]) => { setBins(b.data); setTasks(t.data); })
      .catch(() => { if (!silent) setError('Failed to load data.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  useLiveRefresh(() => load(true)); // refresh silently when the ESP32 pushes new data

  // Auto-dismiss success
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  if (loading) return <Spinner />;
  if (error)   return <p className="text-red-500">{error}</p>;

  const critical = bins.filter(b => b.status === 'Critical');
  const warning  = bins.filter(b => b.status === 'Warning');
  const normal   = bins.filter(b => b.status === 'Normal');
  const pending  = tasks.filter(t => t.status === 'Pending');

  // Which bins to show in the drawer
  const drawerBins =
    drawer === 'all'      ? bins :
    drawer === 'Critical' ? critical :
    drawer === 'Warning'  ? warning :
    drawer === 'Normal'   ? normal : [];

  const drawerTitle =
    drawer === 'all'      ? `All Bins (${bins.length})` :
    drawer === 'Critical' ? `🔴 Critical Bins (${critical.length})` :
    drawer === 'Warning'  ? `🟡 Warning Bins (${warning.length})` :
    drawer === 'Normal'   ? `🟢 Normal Bins (${normal.length})` : '';

  const statCards = [
    { key: 'all',      title: 'Total Bins',    value: bins.length,    icon: '🗑️', bg: 'bg-blue-50',   border: 'border-blue-200',   textColor: 'text-blue-700',   iconBg: 'bg-blue-100'   },
    { key: 'Critical', title: 'Critical Bins', value: critical.length, icon: '🔴', bg: 'bg-red-50',    border: 'border-red-200',    textColor: 'text-red-600',    iconBg: 'bg-red-100',   pulse: critical.length > 0 },
    { key: 'Warning',  title: 'Warning Bins',  value: warning.length,  icon: '🟡', bg: 'bg-amber-50',  border: 'border-amber-200',  textColor: 'text-amber-600',  iconBg: 'bg-amber-100'  },
    { key: 'Normal',   title: 'Normal Bins',   value: normal.length,   icon: '🟢', bg: 'bg-green-50',  border: 'border-green-200',  textColor: 'text-green-600',  iconBg: 'bg-green-100'  },
  ];

  return (
    <div className="space-y-6">

      {successMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          ✅ {successMsg}
        </div>
      )}

      {/* ── Clickable stat cards ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => (
          <ClickableStatCard
            key={card.key}
            {...card}
            onClick={() => setDrawer(card.key)}
          />
        ))}
      </div>

      {/* ── Bins table ──────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">All Bins</h2>
          <span className="text-xs text-gray-400">Click any stat card to filter</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wide">
                <th className="pb-3 pr-4 font-semibold">Bin ID</th>
                <th className="pb-3 pr-4 font-semibold">Coordinates</th>
                <th className="pb-3 pr-4 font-semibold">Fill Level</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bins.map(bin => (
                <tr key={bin._id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-mono font-semibold text-gray-800">{bin.binId}</td>
                  <td className="py-3 pr-4 text-gray-400 text-xs">
                    {bin.location.lat.toFixed(5)}, {bin.location.lng.toFixed(5)}
                  </td>
                  <td className="py-3 pr-4 w-44">
                    <FillBar percentage={bin.fillPercentage} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={bin.status} />
                  </td>
                  <td className="py-3 text-xs text-gray-400">
                    {new Date(bin.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recent tasks ────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Recent Tasks</h2>
          {pending.length > 0 && (
            <span className="badge-pending">{pending.length} pending</span>
          )}
        </div>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400">No tasks yet.</p>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 6).map(task => (
              <div key={task._id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{task.taskId}</p>
                  <p className="text-xs text-gray-400">
                    Bin: {task.binId}
                    {task.assignedEmployeeId?.name && ` · ${task.assignedEmployeeId.name}`}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bin drawer ──────────────────────────────────── */}
      <BinDrawer
        isOpen={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawerTitle}
        bins={drawerBins}
        onAssign={(bin) => setAssignBin(bin)}
      />

      {/* ── Assign task modal ───────────────────────────── */}
      <AssignTaskModal
        bin={assignBin}
        onClose={() => setAssignBin(null)}
        onSuccess={(msg) => { setSuccessMsg(msg); load(); }}
      />
    </div>
  );
}
