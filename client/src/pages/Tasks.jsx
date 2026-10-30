import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../context/LiveContext';
import { getAllTasks, updateTaskStatus } from '../services/taskService';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['Pending', 'In-Progress', 'Completed'];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [filter, setFilter]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [updating, setUpdating] = useState('');

  const fetchTasks = (status = filter, silent = false) => {
    if (!silent) setLoading(true);
    getAllTasks(status)
      .then((res) => setTasks(res.data))
      .catch(() => { if (!silent) setError('Failed to load tasks.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [filter]); // eslint-disable-line
  useLiveRefresh(() => fetchTasks(filter, true));

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdating(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Update failed.');
    } finally {
      setUpdating('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-500 font-medium mr-1">Filter:</span>
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filter === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">📋</span>
          <p className="mt-2 text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Task ID</th>
                  <th className="px-5 py-3 font-medium">Bin</th>
                  <th className="px-5 py-3 font-medium">Assigned To</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  {user?.role !== 'employee' && (
                    <th className="px-5 py-3 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium">{task.taskId}</td>
                    <td className="px-5 py-3 text-gray-600">{task.binId}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {task.assignedEmployeeId?.name ?? (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(task.timestamp).toLocaleString()}
                    </td>
                    {user?.role !== 'employee' && (
                      <td className="px-5 py-3">
                        {task.status !== 'Completed' && (
                          <select
                            value={task.status}
                            disabled={updating === task.taskId}
                            onChange={(e) => handleStatusChange(task.taskId, e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
