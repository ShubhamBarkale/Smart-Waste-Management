import { useEffect, useState, useCallback } from 'react';
import { useLiveRefresh } from '../../context/LiveContext';
import { useAuth } from '../../context/AuthContext';
import { getAllTasks, updateTaskStatus } from '../../services/taskService';
import { getAllBins } from '../../services/binService';
import StatusBadge from '../../components/StatusBadge';
import FillBar from '../../components/FillBar';
import Spinner from '../../components/Spinner';

const TABS = [
  { key: '',           label: 'All',         icon: '📋' },
  { key: 'Pending',    label: 'Pending',      icon: '⏳' },
  { key: 'In-Progress',label: 'In Progress',  icon: '🔄' },
  { key: 'Completed',  label: 'Completed',    icon: '✅' },
];

const STATUS_FLOW = {
  'Pending':     'In-Progress',
  'In-Progress': 'Completed',
};

const BTN_LABEL = {
  'Pending':     '▶ Start Task',
  'In-Progress': '✓ Mark Done',
};

export default function MyTasks() {
  const { user } = useAuth();

  const [myTasks,  setMyTasks]  = useState([]);
  const [bins,     setBins]     = useState([]);
  const [tab,      setTab]      = useState('');
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [taskRes, binRes] = await Promise.all([getAllTasks(), getAllBins()]);
      const mine = taskRes.data.filter(
        t => String(t.assignedEmployeeId?._id ?? t.assignedEmployeeId) === String(user?._id)
      );
      setMyTasks(mine);
      setBins(binRes.data);
    } catch { if (!silent) setError('Failed to load tasks.'); }
    finally  { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(() => load(true));

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const handleAction = async (task) => {
    const next = STATUS_FLOW[task.status];
    if (!next) return;
    setUpdating(task.taskId);
    try {
      await updateTaskStatus(task.taskId, next);
      setSuccess(`Task ${task.taskId} → ${next}`);
      load();
    } catch { setError('Failed to update task status.'); }
    finally  { setUpdating(''); }
  };

  const filtered = tab ? myTasks.filter(t => t.status === tab) : myTasks;

  const counts = {
    '':          myTasks.length,
    'Pending':   myTasks.filter(t => t.status === 'Pending').length,
    'In-Progress': myTasks.filter(t => t.status === 'In-Progress').length,
    'Completed': myTasks.filter(t => t.status === 'Completed').length,
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">

      {/* Alerts */}
      {error   && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>}
      {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{success}</div>}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon} {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
              tab === t.key ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <span className="text-5xl mb-3">📭</span>
          <p className="text-gray-500 font-medium">No tasks here.</p>
          <p className="text-xs text-gray-400 mt-1">
            {tab ? `No ${tab.toLowerCase()} tasks assigned to you.` : 'You have no tasks yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => {
              const order = { 'In-Progress': 0, 'Pending': 1, 'Completed': 2 };
              return (order[a.status] ?? 3) - (order[b.status] ?? 3);
            })
            .map(task => {
              const bin  = bins.find(b => b.binId === task.binId);
              const next = STATUS_FLOW[task.status];

              return (
                <div key={task._id}
                  className={`card border-l-4 transition-shadow hover:shadow-md ${
                    task.status === 'In-Progress' ? 'border-l-blue-500' :
                    task.status === 'Pending'     ? 'border-l-yellow-400' :
                                                    'border-l-green-500'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">

                    {/* Left: task info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-400 font-bold">{task.taskId}</span>
                        <StatusBadge status={task.status} />
                        {task.status === 'In-Progress' && (
                          <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                            In progress
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-800 font-mono">{task.binId}</span>
                        {bin && <StatusBadge status={bin.status} />}
                      </div>

                      {bin && (
                        <div className="w-full max-w-xs">
                          <FillBar percentage={bin.fillPercentage} />
                        </div>
                      )}

                      {bin && (
                        <p className="text-xs text-gray-400">
                          📍 {bin.location.lat.toFixed(5)}, {bin.location.lng.toFixed(5)}
                        </p>
                      )}

                      <p className="text-xs text-gray-400">
                        Assigned: {new Date(task.timestamp).toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Right: action */}
                    {next && (
                      <button
                        onClick={() => handleAction(task)}
                        disabled={updating === task.taskId}
                        className={`shrink-0 font-bold text-sm px-4 py-2.5 rounded-xl text-white transition-colors disabled:opacity-50 ${
                          task.status === 'Pending'
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {updating === task.taskId ? '…' : BTN_LABEL[task.status]}
                      </button>
                    )}
                    {task.status === 'Completed' && (
                      <span className="shrink-0 text-green-600 font-bold text-sm bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}
