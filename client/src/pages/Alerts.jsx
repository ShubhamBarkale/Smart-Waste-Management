import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../context/LiveContext';
import { getCriticalBins } from '../services/binService';
import { createTask } from '../services/taskService';
import StatusBadge from '../components/StatusBadge';
import FillBar from '../components/FillBar';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

export default function Alerts() {
  const { user } = useAuth();
  const [bins, setBins]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [dispatching, setDispatching] = useState('');
  const [success, setSuccess]   = useState('');

  const fetchCritical = (silent = false) => {
    if (!silent) setLoading(true);
    getCriticalBins()
      .then((res) => setBins(res.data))
      .catch(() => { if (!silent) setError('Failed to load critical bins.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCritical(); }, []); // eslint-disable-line
  useLiveRefresh(() => fetchCritical(true));

  const handleDispatch = async (binId) => {
    setDispatching(binId);
    setSuccess('');
    try {
      await createTask({ binId });
      setSuccess(`Task dispatched for bin ${binId}`);
      fetchCritical();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to dispatch task.');
    } finally {
      setDispatching('');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">
          Critical Bins
          {bins.length > 0 && (
            <span className="ml-2 badge-critical">{bins.length}</span>
          )}
        </h2>
        <button onClick={() => fetchCritical()} className="btn-secondary text-sm">
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
          {success}
        </div>
      )}

      {bins.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-4xl">✅</span>
          <p className="mt-2 text-gray-500">No critical bins right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bins.map((bin) => (
            <div key={bin._id} className="card border-l-4 border-red-500 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800 font-mono">{bin.binId}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {bin.location.lat.toFixed(4)}, {bin.location.lng.toFixed(4)}
                  </p>
                </div>
                <StatusBadge status={bin.status} />
              </div>

              <FillBar percentage={bin.fillPercentage} />

              <div>
                {bin.openTasks?.length > 0 ? (
                  <p className="text-xs text-blue-600 font-medium">
                    {bin.openTasks.length} open task(s) assigned
                  </p>
                ) : (
                  user?.role === 'admin' && (
                    <button
                      onClick={() => handleDispatch(bin.binId)}
                      disabled={dispatching === bin.binId}
                      className="btn-danger text-sm w-full"
                    >
                      {dispatching === bin.binId ? 'Dispatching…' : '🚛 Dispatch Task'}
                    </button>
                  )
                )}
              </div>

              <p className="text-xs text-gray-400">
                Last updated: {new Date(bin.lastUpdated).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
