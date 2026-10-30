import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../../context/LiveContext';
import { useAuth } from '../../context/AuthContext';
import { getAllBins, manualUpdateBin } from '../../services/binService';
import { THRESHOLDS, getStatus } from '../../config/thresholds';
import FillBar from '../../components/FillBar';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';

const ZONE_PREFIX = { kopargaon: 'KOP', shirdi: 'SHR' };

export default function BinScanner() {
  const { user }  = useAuth();
  const prefix    = ZONE_PREFIX[user?.zone] ?? '';

  const [bins,       setBins]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedBin,setSelectedBin]= useState(null);
  const [fillInput,  setFillInput]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getAllBins();
      setBins(res.data.filter(b => b.binId.startsWith(prefix)));
    } catch { if (!silent) setError('Failed to load bins.'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line
  useLiveRefresh(() => load(true));

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const handleSelect = (bin) => {
    setSelectedBin(bin);
    setFillInput(String(bin.fillPercentage));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(fillInput);
    if (isNaN(val) || val < 0 || val > 100) {
      setError('Fill percentage must be between 0 and 100.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await manualUpdateBin({
        binId:          selectedBin.binId,
        fillPercentage: val,
        lat:            selectedBin.location.lat,
        lng:            selectedBin.location.lng,
      });
      const newStatus = getStatus(val);
      setSuccess(`✅ ${selectedBin.binId} updated to ${val}% (${newStatus})`);
      setSelectedBin(null);
      setFillInput('');
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  const critical = bins.filter(b => b.status === 'Critical').length;
  const warning  = bins.filter(b => b.status === 'Warning').length;
  const normal   = bins.filter(b => b.status === 'Normal').length;

  return (
    <div className="space-y-5">

      {/* Info banner */}
      <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <span className="text-2xl shrink-0">📡</span>
        <div>
          <p className="font-bold text-green-800 text-sm">Bin Scanner — Manual Update</p>
          <p className="text-xs text-green-700 mt-0.5">
            Select a bin from your zone and enter the current fill level (use this when a sensor is offline or needs correcting).
            Status is auto-derived: below {THRESHOLDS.HALF}% Normal · {THRESHOLDS.HALF}–{THRESHOLDS.CRITICAL - 1}% Warning · {THRESHOLDS.CRITICAL}–100% Critical.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error   && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>}
      {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{success}</div>}

      {/* Zone summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Critical', value: critical, color: 'text-red-600',   bg: 'bg-red-50',   icon: '🔴' },
          { label: 'Warning',  value: warning,  color: 'text-amber-600', bg: 'bg-amber-50', icon: '🟡' },
          { label: 'Normal',   value: normal,   color: 'text-green-600', bg: 'bg-green-50', icon: '🟢' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 px-4 py-3 text-center`}>
            <p className="text-xl">{s.icon}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bin selector */}
        <div className="card space-y-3">
          <h3 className="font-bold text-gray-800">Select Bin to Update</h3>
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {bins.sort((a,b) => b.fillPercentage - a.fillPercentage).map(bin => (
              <button key={bin._id}
                onClick={() => handleSelect(bin)}
                className={`w-full text-left rounded-xl border px-4 py-3 space-y-2 transition-all ${
                  selectedBin?._id === bin._id
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-gray-800">{bin.binId}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={bin.status} />
                    {selectedBin?._id === bin._id && (
                      <span className="text-xs text-green-600 font-bold">● Selected</span>
                    )}
                  </div>
                </div>
                <FillBar percentage={bin.fillPercentage} />
                <p className="text-xs text-gray-400">
                  Last updated: {new Date(bin.lastUpdated).toLocaleString('en-IN')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Update form */}
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-800">Update Fill Level</h3>

          {!selectedBin ? (
            <div className="flex flex-col items-center py-12 text-center">
              <span className="text-5xl mb-3">👆</span>
              <p className="text-gray-400 text-sm">Select a bin on the left to update its fill level.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Selected bin info */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-800">{selectedBin.binId}</span>
                  <StatusBadge status={selectedBin.status} />
                </div>
                <FillBar percentage={selectedBin.fillPercentage} />
                <p className="text-xs text-gray-400">
                  📍 {selectedBin.location.lat.toFixed(5)}, {selectedBin.location.lng.toFixed(5)}
                </p>
              </div>

              {/* Slider + number input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  New Fill Percentage
                  <span className={`ml-2 font-bold text-lg ${
                    Number(fillInput) >= THRESHOLDS.CRITICAL ? 'text-red-600' :
                    Number(fillInput) >= THRESHOLDS.HALF ? 'text-amber-500' : 'text-green-600'
                  }`}>{fillInput}%</span>
                </label>

                <input type="range" min="0" max="100" step="1"
                  value={fillInput}
                  onChange={e => setFillInput(e.target.value)}
                  className="w-full accent-green-600 cursor-pointer"
                />

                {/* Color stops under slider */}
                <div className="flex justify-between text-xs text-gray-400 px-0.5">
                  <span className="text-green-600">0 Normal</span>
                  <span className="text-amber-500">50 Warning</span>
                  <span className="text-red-600">80 Critical</span>
                </div>

                <input type="number" min="0" max="100"
                  value={fillInput}
                  onChange={e => setFillInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-lg font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0–100"
                />
              </div>

              {/* New status preview */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">New status will be:</span>
                <StatusBadge status={deriveStatus(Number(fillInput))} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setSelectedBin(null); setFillInput(''); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex-1"
                >
                  {submitting ? 'Updating…' : '📡 Submit Update'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
