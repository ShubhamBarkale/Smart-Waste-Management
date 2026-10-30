import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../../context/LiveContext';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllTasks, updateTaskStatus } from '../../services/taskService';
import { getAllBins } from '../../services/binService';
import FillBar from '../../components/FillBar';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';

const ZONE_META = {
  kopargaon: { label: 'Kopargaon', emoji: '🏘️', prefix: 'KOP', gradient: 'from-blue-600 to-blue-800',   light: 'bg-blue-50 border-blue-200',   text: 'text-blue-700'   },
  shirdi:    { label: 'Shirdi',    emoji: '🛕',  prefix: 'SHR', gradient: 'from-orange-500 to-orange-700', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
};

function StatChip({ label, value, icon, color = 'text-gray-700', bg = 'bg-gray-50' }) {
  return (
    <div className={`${bg} rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { user }  = useAuth();
  const zone      = ZONE_META[user?.zone];

  const [myTasks,  setMyTasks]  = useState([]);
  const [zoneBins, setZoneBins] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [completing, setCompleting] = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [taskRes, binRes] = await Promise.all([getAllTasks(), getAllBins()]);
      const mine = taskRes.data.filter(
        t => String(t.assignedEmployeeId?._id ?? t.assignedEmployeeId) === String(user?._id)
      );
      setMyTasks(mine);
      if (zone) setZoneBins(binRes.data.filter(b => b.binId.startsWith(zone.prefix)));
    } catch { if (!silent) setError('Failed to load data.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line
  useLiveRefresh(() => load(true));

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const markDone = async (task) => {
    setCompleting(task.taskId);
    try {
      await updateTaskStatus(task.taskId, 'Completed');
      setSuccess(`✅ Task ${task.taskId} marked as completed!`);
      load();
    } catch { setError('Failed to update task.'); }
    finally { setCompleting(''); }
  };

  if (loading) return <Spinner />;

  const active    = myTasks.filter(t => t.status !== 'Completed');
  const completed = myTasks.filter(t => t.status === 'Completed');
  const critical  = zoneBins.filter(b => b.status === 'Critical');
  const today     = completed.filter(t => {
    const d = new Date(t.updatedAt ?? t.timestamp);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });

  return (
    <div className="space-y-6">

      {/* ── Hero banner ───────────────────────────────── */}
      <div className={`bg-gradient-to-r ${zone?.gradient ?? 'from-gray-700 to-gray-900'} rounded-2xl px-6 py-6 text-white`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-medium opacity-80">Good day,</p>
            <h2 className="text-2xl font-bold mt-0.5">{user?.name} 👋</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">{zone?.emoji}</span>
              <span className="text-sm font-medium opacity-90">{zone?.label} Zone</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {active.length > 0 ? `${active.length} active task${active.length > 1 ? 's' : ''}` : 'All clear!'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</p>
            <p className="text-3xl font-bold mt-1">{new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* ── Alerts ────────────────────────────────────── */}
      {error   && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>}
      {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{success}</div>}

      {/* ── Stat chips ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatChip label="Active Tasks"     value={active.length}    icon="📋" color="text-blue-600"   bg="bg-blue-50"   />
        <StatChip label="Completed Today"  value={today.length}     icon="✅" color="text-green-600"  bg="bg-green-50"  />
        <StatChip label="Total Completed"  value={completed.length} icon="🏆" color="text-purple-600" bg="bg-purple-50" />
        <StatChip label="Critical in Zone" value={critical.length}  icon="🔴" color="text-red-600"    bg="bg-red-50"    />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── My active tasks ───────────────────────────── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Active Tasks</h3>
            <Link to="/emp/tasks" className="text-xs text-green-600 hover:text-green-800 font-semibold">View all →</Link>
          </div>

          {active.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="text-4xl mb-2">🎉</span>
              <p className="text-gray-500 font-medium text-sm">No active tasks!</p>
              <p className="text-xs text-gray-400 mt-1">Check back later or ask admin for assignment.</p>
            </div>
          ) : (
            active.map(task => (
              <div key={task._id}
                className="flex items-start justify-between gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-gray-500">{task.taskId}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="font-bold text-gray-800">{task.binId}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Assigned {new Date(task.timestamp).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {task.status !== 'Completed' && (
                  <button
                    onClick={() => markDone(task)}
                    disabled={completing === task.taskId}
                    className="shrink-0 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                  >
                    {completing === task.taskId ? '…' : '✓ Done'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Zone bin status ───────────────────────────── */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">{zone?.emoji} {zone?.label} Bins</h3>
            <Link to="/emp/scanner" className="text-xs text-green-600 hover:text-green-800 font-semibold">Update bin →</Link>
          </div>

          {zoneBins.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No bins in your zone.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {zoneBins
                .sort((a, b) => b.fillPercentage - a.fillPercentage)
                .map(bin => (
                  <div key={bin._id}
                    className={`rounded-xl border p-3 space-y-2 ${
                      bin.status === 'Critical' ? 'bg-red-50 border-red-200' :
                      bin.status === 'Warning'  ? 'bg-amber-50 border-amber-200' :
                                                  'bg-gray-50 border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-gray-800">{bin.binId}</span>
                      <StatusBadge status={bin.status} />
                    </div>
                    <FillBar percentage={bin.fillPercentage} />
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {/* ── Quick action cards ────────────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/emp/tasks',   icon: '📋', title: 'View All Tasks',    desc: 'See pending, in-progress & completed', color: 'border-blue-200   hover:bg-blue-50'   },
            { to: '/emp/scanner', icon: '📡', title: 'Update Bin Fill',   desc: 'Report current bin fill level',        color: 'border-green-200  hover:bg-green-50'  },
            { to: '/emp/profile', icon: '👤', title: 'My Profile',        desc: 'View your zone and account info',      color: 'border-purple-200 hover:bg-purple-50' },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className={`card border-2 ${a.color} transition-colors flex items-start gap-4 group`}
            >
              <span className="text-3xl mt-0.5">{a.icon}</span>
              <div>
                <p className="font-bold text-gray-800 group-hover:text-gray-900">{a.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
