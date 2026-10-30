import { useEffect, useState, useCallback } from 'react';
import { getAllBins, getCriticalBins } from '../services/binService';
import { useLiveRefresh } from '../context/LiveContext';
import { THRESHOLDS } from '../config/thresholds';
import SummaryCards from '../components/SummaryCards';
import CriticalAlertsTable from '../components/CriticalAlertsTable';
import AssignTaskModal from '../components/AssignTaskModal';

const AUTO_REFRESH_MS = 30_000; // re-poll every 30 seconds

export default function CommandCenter() {
  // ── State ────────────────────────────────────────────────
  const [allBins, setAllBins]           = useState([]);
  const [criticalBins, setCriticalBins] = useState([]);
  const [loadingAll, setLoadingAll]     = useState(true);
  const [loadingCrit, setLoadingCrit]   = useState(true);
  const [error, setError]               = useState('');
  const [lastRefresh, setLastRefresh]   = useState(null);

  // Modal state
  const [selectedBin, setSelectedBin]   = useState(null); // bin to assign
  const [successMsg, setSuccessMsg]     = useState('');

  // ── Data fetching ────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setError('');
    try {
      const res = await getAllBins();
      setAllBins(res.data);
    } catch {
      setError('Failed to load bin overview.');
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const fetchCritical = useCallback(async () => {
    try {
      const res = await getCriticalBins();
      setCriticalBins(res.data);
    } catch {
      // non-blocking; summary cards already show the count
    } finally {
      setLoadingCrit(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoadingAll(true);
    setLoadingCrit(true);
    Promise.all([fetchAll(), fetchCritical()]).then(() =>
      setLastRefresh(new Date())
    );
  }, [fetchAll, fetchCritical]);

  // Instant refresh when the server pushes new sensor data (30 s polling stays as a fallback)
  useLiveRefresh(() => { fetchAll(); fetchCritical(); });

  // Initial load + auto-refresh
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Auto-dismiss success banner
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // ── Handlers ─────────────────────────────────────────────
  const handleAssignClick = (bin) => {
    setSuccessMsg('');
    setSelectedBin(bin);
  };

  const handleDispatchSuccess = (msg) => {
    setSuccessMsg(msg);
    // Refresh data so the table updates immediately
    fetchCritical();
    fetchAll();
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header bar ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Command Center</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Live overview · updates instantly from sensors
            {lastRefresh && (
              <span className="ml-2 text-gray-300">
                · Last: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loadingAll || loadingCrit}
          className="btn-secondary text-sm flex items-center gap-2"
        >
          <span className={loadingAll || loadingCrit ? 'animate-spin' : ''}>🔄</span>
          Refresh
        </button>
      </div>

      {/* ── Global error ─────────────────────────────────── */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Success banner ───────────────────────────────── */}
      {successMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>✅</span> {successMsg}
        </div>
      )}

      {/* ── Summary cards ────────────────────────────────── */}
      <SummaryCards bins={allBins} loading={loadingAll} />

      {/* ── Critical alerts section ──────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
            🔴 Critical Alerts
            {criticalBins.length > 0 && !loadingCrit && (
              <span className="badge-critical">{criticalBins.length}</span>
            )}
          </h3>
          <p className="text-xs text-gray-400">
            Bins with fill ≥ {THRESHOLDS.CRITICAL}% requiring immediate collection
          </p>
        </div>

        <CriticalAlertsTable
          bins={criticalBins}
          onAssign={handleAssignClick}
          loading={loadingCrit}
        />
      </div>

      {/* ── Assign Task Modal ────────────────────────────── */}
      <AssignTaskModal
        bin={selectedBin}
        onClose={() => setSelectedBin(null)}
        onSuccess={handleDispatchSuccess}
      />
    </div>
  );
}
