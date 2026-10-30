import { useEffect, useState, useCallback } from 'react';
import { getEmployeeAvailability } from '../services/userService';
import { getAllBins } from '../services/binService';
import { getAllTasks, createTask, assignTask, updateTaskStatus } from '../services/taskService';
import StatusBadge from '../components/StatusBadge';
import FillBar from '../components/FillBar';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ZONES = [
  {
    key:    'kopargaon',
    label:  'Kopargaon',
    emoji:  '🏘️',
    color:  'blue',
    prefix: 'KOP',
    desc:   'Ahmednagar district — Godavari River belt',
  },
  {
    key:    'shirdi',
    label:  'Shirdi',
    emoji:  '🛕',
    color:  'orange',
    prefix: 'SHR',
    desc:   'Pilgrimage city — Sai Baba Samadhi Mandir area',
  },
];

const ZONE_COLORS = {
  blue:   { card: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700',   ring: 'border-blue-500 bg-blue-50'   },
  orange: { card: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', btn: 'bg-orange-600 hover:bg-orange-700', ring: 'border-orange-500 bg-orange-50' },
};

function Avatar({ name, size = 'md', color = 'bg-gray-500' }) {
  const dim = size === 'lg' ? 'h-12 w-12 text-lg' : size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none`}>
      {name[0].toUpperCase()}
    </div>
  );
}

const AVATAR_COLORS = ['bg-indigo-500','bg-teal-500','bg-violet-500','bg-rose-500','bg-cyan-500','bg-amber-500'];
const avatarColor = (name) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─────────────────────────────────────────────────────────────────────────────
// Assign Bin Modal — shows zone bins + available/unavailable employee list
// ─────────────────────────────────────────────────────────────────────────────
function AssignBinModal({ zone, employees, bins, tasks, onClose, onSuccess }) {
  const zoneMeta = ZONES.find(z => z.key === zone);
  const colors   = ZONE_COLORS[zoneMeta.color];

  const [step, setStep]             = useState(1); // 1 = select bin, 2 = select employee
  const [selectedBin,  setSelectedBin]  = useState(null);
  const [selectedEmp,  setSelectedEmp]  = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  // Only zone bins
  const zoneBins = bins.filter(b => b.binId.startsWith(zoneMeta.prefix));
  const filtered = statusFilter ? zoneBins.filter(b => b.status === statusFilter) : zoneBins;

  // Available = no active task. Unavailable = has active (Pending/In-Progress) task
  const available   = employees.filter(e => !e.isBusy);
  const unavailable = employees.filter(e =>  e.isBusy);

  const handleConfirm = async () => {
    if (!selectedBin || !selectedEmp) { setError('Select both a bin and an employee.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const taskRes = await createTask({ binId: selectedBin.binId });
      await assignTask(taskRes.data.taskId, selectedEmp._id);
      onSuccess(`✅ ${selectedBin.binId} assigned to ${selectedEmp.name}`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Assignment failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = step === 1
    ? `${zoneMeta.emoji} Step 1 — Select a Bin (${zoneMeta.label})`
    : `${zoneMeta.emoji} Step 2 — Select an Employee (${zoneMeta.label})`;

  return (
    <Modal isOpen onClose={onClose} title={title}>

      {/* ── Step indicator ── */}
      <div className="flex items-center gap-2 mb-5">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
              step === s ? `${colors.btn} text-white border-transparent` : step > s ? 'bg-green-500 text-white border-transparent' : 'bg-white text-gray-400 border-gray-300'
            }`}>
              {step > s ? '✓' : s}
            </div>
            <span className={`text-xs font-medium ${step === s ? 'text-gray-800' : 'text-gray-400'}`}>
              {s === 1 ? 'Choose Bin' : 'Assign Employee'}
            </span>
            {s < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {/* ── STEP 1 — Bin selection ── */}
      {step === 1 && (
        <>
          {/* Status filter */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {['', 'Critical', 'Warning', 'Normal'].map(s => (
              <button key={s || 'all'}
                onClick={() => { setStatusFilter(s); setSelectedBin(null); }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  statusFilter === s
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                }`}
              >
                {s || 'All'} ({(s ? zoneBins.filter(b => b.status === s) : zoneBins).length})
              </button>
            ))}
          </div>

          {/* Bin list */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-4">
            {filtered.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No bins found.</p>
              : filtered.map(bin => {
                  const hasPendingTask = tasks.some(t =>
                    t.binId === bin.binId && ['Pending','In-Progress'].includes(t.status)
                  );
                  return (
                    <label key={bin._id}
                      className={`flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                        hasPendingTask ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' :
                        selectedBin?._id === bin._id ? colors.ring + ' border-2' :
                        'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input type="radio" name="bin-select" value={bin._id}
                        disabled={hasPendingTask}
                        checked={selectedBin?._id === bin._id}
                        onChange={() => { setSelectedBin(bin); setError(''); }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-gray-800">{bin.binId}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={bin.status} />
                            {hasPendingTask && <span className="text-xs text-gray-400 italic">task active</span>}
                          </div>
                        </div>
                        <FillBar percentage={bin.fillPercentage} />
                        <p className="text-xs text-gray-400">📍 {bin.location.lat.toFixed(5)}, {bin.location.lng.toFixed(5)}</p>
                      </div>
                    </label>
                  );
                })
            }
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

          <div className="flex justify-end">
            <button onClick={() => { if (!selectedBin) { setError('Please select a bin.'); return; } setError(''); setStep(2); }}
              className={`${colors.btn} text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors`}>
              Next: Choose Employee →
            </button>
          </div>
        </>
      )}

      {/* ── STEP 2 — Employee selection ── */}
      {step === 2 && (
        <>
          {/* Selected bin recap */}
          <div className={`${colors.card} border rounded-xl px-4 py-3 mb-4`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-gray-800">{selectedBin?.binId}</span>
              <StatusBadge status={selectedBin?.status} />
            </div>
            <FillBar percentage={selectedBin?.fillPercentage} />
          </div>

          <div className="space-y-4 max-h-64 overflow-y-auto pr-1 mb-4">

            {/* Available employees */}
            <div>
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                Available ({available.length})
              </p>
              {available.length === 0
                ? <p className="text-xs text-gray-400 italic px-2">No available employees right now.</p>
                : available.map(emp => (
                    <label key={emp._id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors mb-2 ${
                        selectedEmp?._id === emp._id ? colors.ring + ' border-2' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input type="radio" name="emp-select" value={emp._id}
                        checked={selectedEmp?._id === emp._id}
                        onChange={() => { setSelectedEmp(emp); setError(''); }}
                        className="accent-green-600"
                      />
                      <Avatar name={emp.name} color={avatarColor(emp.name)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{emp.name}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">Free</span>
                    </label>
                  ))
              }
            </div>

            {/* Unavailable employees */}
            {unavailable.length > 0 && (
              <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                  Unavailable ({unavailable.length})
                </p>
                {unavailable.map(emp => (
                  <div key={emp._id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 opacity-60 mb-2"
                  >
                    <Avatar name={emp.name} color="bg-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-600 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {emp.activeTasks?.length
                          ? `On task: ${emp.activeTasks.map(t => t.binId).join(', ')}`
                          : emp.email}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full shrink-0">Busy</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>}

          <div className="flex gap-3 justify-between">
            <button onClick={() => { setStep(1); setSelectedEmp(null); setError(''); }} className="btn-secondary text-sm">
              ← Back
            </button>
            <button onClick={handleConfirm}
              disabled={submitting || !selectedEmp}
              className={`${colors.btn} disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors`}>
              {submitting ? 'Assigning…' : '🚛 Confirm Assignment'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employee Card
// ─────────────────────────────────────────────────────────────────────────────
function EmployeeCard({ employee, tasks, zoneColor, onComplete }) {
  const myTasks   = tasks.filter(t => String(t.assignedEmployeeId?._id ?? t.assignedEmployeeId) === String(employee._id));
  const active    = myTasks.filter(t => t.status !== 'Completed');
  const completed = myTasks.filter(t => t.status === 'Completed');
  const colors    = ZONE_COLORS[zoneColor];
  const isBusy    = employee.isBusy ?? active.length > 0;

  return (
    <div className={`card border-l-4 ${isBusy ? 'border-l-red-400' : 'border-l-green-400'} space-y-3 transition-shadow hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={employee.name} size="lg" color={avatarColor(employee.name)} />
          <div>
            <p className="font-bold text-gray-800 leading-tight">{employee.name}</p>
            <p className="text-xs text-gray-400 truncate max-w-[160px]">{employee.email}</p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
          isBusy ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
        }`}>
          {isBusy ? '🔴 Busy' : '🟢 Available'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Total',      value: myTasks.length,   color: 'text-gray-700'  },
          { label: 'Active',     value: active.length,    color: 'text-blue-600'  },
          { label: 'Completed',  value: completed.length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 rounded-xl py-2">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active tasks */}
      {active.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Assignments</p>
          {active.map(task => (
            <div key={task._id}
              className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-3 py-2"
            >
              <div>
                <p className="text-sm font-mono font-bold text-gray-800">{task.binId}</p>
                <p className="text-xs text-gray-400">{task.taskId}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={task.status} />
                <button onClick={() => onComplete(task)}
                  className="text-xs font-semibold text-green-600 hover:text-green-800 transition-colors"
                  title="Mark completed"
                >✓ Done</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length === 0 && (
        <p className="text-xs text-gray-400 italic text-center py-0.5">No active assignments</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone Section — full panel for one zone
// ─────────────────────────────────────────────────────────────────────────────
function ZoneSection({ zone, employees, bins, tasks, onAssign, onComplete, loading }) {
  const zMeta     = ZONES.find(z => z.key === zone);
  const colors    = ZONE_COLORS[zMeta.color];
  const zoneBins  = bins.filter(b => b.binId.startsWith(zMeta.prefix));
  const available = employees.filter(e => !e.isBusy).length;
  const busy      = employees.filter(e =>  e.isBusy).length;

  return (
    <div className="space-y-4">
      {/* Zone header */}
      <div className={`rounded-2xl border ${colors.card} px-6 py-4`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>{zMeta.emoji}</span> {zMeta.label} Zone
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{zMeta.desc}</p>
          </div>

          {/* Zone stats chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: `${employees.length} Employees`, icon: '👷' },
              { label: `${available} Available`,        icon: '🟢' },
              { label: `${busy} Busy`,                  icon: '🔴' },
              { label: `${zoneBins.length} Bins`,       icon: '🗑️'  },
              { label: `${zoneBins.filter(b => b.status === 'Critical').length} Critical`, icon: '⚠️' },
            ].map(c => (
              <span key={c.label} className={`${colors.badge} text-xs font-semibold px-3 py-1 rounded-full`}>
                {c.icon} {c.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => onAssign(zone)}
            className={`${colors.btn} text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0`}
          >
            + Assign Bin
          </button>
        </div>
      </div>

      {/* Employee cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="card text-center py-10">
          <span className="text-3xl">👷</span>
          <p className="text-gray-400 mt-2 text-sm">No employees in this zone yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map(emp => (
            <EmployeeCard
              key={emp._id}
              employee={emp}
              tasks={tasks}
              zoneColor={zMeta.color}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Employees Page
// ─────────────────────────────────────────────────────────────────────────────
export default function Employees() {
  const [kopEmps,   setKopEmps]   = useState([]);
  const [shrEmps,   setShrEmps]   = useState([]);
  const [bins,      setBins]      = useState([]);
  const [tasks,     setTasks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [successMsg,setSuccessMsg]= useState('');

  // Active zone tab: 'both' | 'kopargaon' | 'shirdi'
  const [activeTab, setActiveTab] = useState('both');

  // Assign modal
  const [assignZone, setAssignZone] = useState(null); // 'kopargaon' | 'shirdi'

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [kopRes, shrRes, binRes, taskRes] = await Promise.all([
        getEmployeeAvailability('kopargaon'),
        getEmployeeAvailability('shirdi'),
        getAllBins(),
        getAllTasks(),
      ]);
      setKopEmps(kopRes.data);
      setShrEmps(shrRes.data);
      setBins(binRes.data);
      setTasks(taskRes.data);
    } catch {
      setError('Failed to load data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 5000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const handleComplete = async (task) => {
    try {
      await updateTaskStatus(task.taskId, 'Completed');
      setSuccessMsg(`Task ${task.taskId} marked as completed.`);
      load();
    } catch { setError('Failed to update task.'); }
  };

  // Global summary numbers
  const allEmps    = [...kopEmps, ...shrEmps];
  const totalBusy  = allEmps.filter(e => e.isBusy).length;
  const totalFree  = allEmps.filter(e => !e.isBusy).length;
  const activeTasks= tasks.filter(t => t.assignedEmployeeId && t.status !== 'Completed');

  const assignModalEmps = assignZone === 'kopargaon' ? kopEmps : shrEmps;

  return (
    <div className="space-y-6">

      {/* ── Page header ───────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Employees</h2>
          <p className="text-sm text-gray-400 mt-0.5">Zone-based workforce — Kopargaon & Shirdi</p>
        </div>
        <button onClick={load} className="btn-secondary text-sm flex items-center gap-1.5">
          🔄 Refresh
        </button>
      </div>

      {/* ── Alerts ────────────────────────────────────── */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">⚠️ {error}</div>
      )}
      {successMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">{successMsg}</div>
      )}

      {/* ── Global summary strip ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: allEmps.length,      color: 'text-gray-700',   bg: 'bg-gray-50',   icon: '👥' },
          { label: 'Available',       value: totalFree,           color: 'text-green-600',  bg: 'bg-green-50',  icon: '🟢' },
          { label: 'Busy',            value: totalBusy,           color: 'text-red-600',    bg: 'bg-red-50',    icon: '🔴' },
          { label: 'Active Tasks',    value: activeTasks.length,  color: 'text-blue-600',   bg: 'bg-blue-50',   icon: '📋' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3`}>
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Zone tab switcher ─────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'both',      label: '🗺️ Both Zones' },
          { key: 'kopargaon', label: '🏘️ Kopargaon' },
          { key: 'shirdi',    label: '🛕 Shirdi'     },
        ].map(tab => (
          <button key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Zone sections ─────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {(activeTab === 'both' || activeTab === 'kopargaon') && (
            <ZoneSection
              zone="kopargaon"
              employees={kopEmps}
              bins={bins}
              tasks={tasks}
              onAssign={setAssignZone}
              onComplete={handleComplete}
              loading={false}
            />
          )}
          {(activeTab === 'both' || activeTab === 'shirdi') && (
            <ZoneSection
              zone="shirdi"
              employees={shrEmps}
              bins={bins}
              tasks={tasks}
              onAssign={setAssignZone}
              onComplete={handleComplete}
              loading={false}
            />
          )}
        </div>
      )}

      {/* ── Active assignments table ──────────────────── */}
      {activeTasks.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-700 mb-4">All Active Assignments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 pr-4">Zone</th>
                  <th className="pb-3 pr-4">Employee</th>
                  <th className="pb-3 pr-4">Bin</th>
                  <th className="pb-3 pr-4">Fill</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Assigned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activeTasks.map(task => {
                  const bin  = bins.find(b => b.binId === task.binId);
                  const emp  = task.assignedEmployeeId;
                  const zone = task.binId?.startsWith('KOP') ? ZONES[0] : ZONES[1];
                  const colors = ZONE_COLORS[zone.color];
                  return (
                    <tr key={task._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {zone.emoji} {zone.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {emp?.name && <Avatar name={emp.name} size="sm" color={avatarColor(emp.name)} />}
                          <div>
                            <p className="font-medium text-gray-800 text-xs">{emp?.name ?? '—'}</p>
                            <p className="text-xs text-gray-400">{emp?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-mono font-bold text-gray-800">{task.binId}</td>
                      <td className="py-3 pr-4 w-32">
                        {bin ? <FillBar percentage={bin.fillPercentage} /> : '—'}
                      </td>
                      <td className="py-3 pr-4"><StatusBadge status={task.status} /></td>
                      <td className="py-3 text-xs text-gray-400">{new Date(task.timestamp).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Assign Bin Modal ──────────────────────────── */}
      {assignZone && (
        <AssignBinModal
          zone={assignZone}
          employees={assignModalEmps}
          bins={bins}
          tasks={tasks}
          onClose={() => setAssignZone(null)}
          onSuccess={(msg) => { setSuccessMsg(msg); load(); }}
        />
      )}
    </div>
  );
}
