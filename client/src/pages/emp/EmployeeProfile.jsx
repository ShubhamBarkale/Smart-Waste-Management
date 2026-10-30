import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllTasks } from '../../services/taskService';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

// ── Zone config ───────────────────────────────────────────────────────────────
const ZONE_INFO = {
  kopargaon: {
    label:    'Kopargaon Zone',
    emoji:    '🏘️',
    desc:     'Ahmednagar district — Godavari River belt',
    coords:   '19.885°N, 74.478°E',
    pop:      '65,273',
    district: 'Ahmednagar, Maharashtra',
    note:     'Known for Daityaguru Shukracharya temple and Datta Par site.',
    bannerFrom: 'from-blue-500',
    bannerTo:   'to-blue-800',
    zoneBg:     'bg-blue-50',
    zoneBorder: 'border-blue-200',
    zoneTitle:  'text-blue-800',
    zoneText:   'text-blue-600',
    infoBg:     'bg-blue-100',
    infoText:   'text-blue-700',
    avatarBg:   'bg-blue-600',
  },
  shirdi: {
    label:    'Shirdi Zone',
    emoji:    '🛕',
    desc:     'Famous pilgrimage city — Sai Baba Samadhi Mandir',
    coords:   '19.77°N, 74.48°E',
    pop:      '36,004',
    district: 'Ahmednagar, Maharashtra',
    note:     "One of India's most visited pilgrimage destinations.",
    bannerFrom: 'from-orange-400',
    bannerTo:   'to-orange-700',
    zoneBg:     'bg-orange-50',
    zoneBorder: 'border-orange-200',
    zoneTitle:  'text-orange-800',
    zoneText:   'text-orange-600',
    infoBg:     'bg-orange-100',
    infoText:   'text-orange-700',
    avatarBg:   'bg-orange-500',
  },
};

const AVATAR_COLORS = [
  'bg-indigo-500','bg-teal-500','bg-violet-500',
  'bg-rose-500',  'bg-cyan-600','bg-amber-500',
];
const avatarBg = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ── Stat tile ─────────────────────────────────────────────────────────────────
function StatTile({ icon, value, label, valueClass = 'text-gray-800' }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm py-5 px-3 gap-1">
      <span className="text-2xl">{icon}</span>
      <span className={`text-3xl font-extrabold tracking-tight ${valueClass}`}>{value}</span>
      <span className="text-xs font-medium text-gray-400 text-center leading-tight">{label}</span>
    </div>
  );
}

// ── Info tile (zone details grid) ─────────────────────────────────────────────
function InfoTile({ label, value, bg, text }) {
  return (
    <div className={`${bg} rounded-xl px-4 py-3 space-y-0.5`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${text} opacity-70`}>{label}</p>
      <p className="text-sm font-bold text-gray-800 leading-snug">{value}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmployeeProfile() {
  const { user }  = useAuth();
  const zone      = ZONE_INFO[user?.zone] ?? null;

  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTasks()
      .then(res => {
        const mine = res.data.filter(
          t => String(t.assignedEmployeeId?._id ?? t.assignedEmployeeId) === String(user?._id)
        );
        setTasks(mine);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner />;

  const active    = tasks.filter(t => t.status !== 'Completed');
  const completed = tasks.filter(t => t.status === 'Completed');
  const rate      = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;

  // Day streak
  const completedDates = [...new Set(
    completed.map(t => new Date(t.updatedAt ?? t.timestamp).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  const now = new Date();
  for (let i = 0; i < completedDates.length; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (completedDates[i] === d.toDateString()) streak++;
    else break;
  }

  const bannerGradient = zone
    ? `bg-gradient-to-br ${zone.bannerFrom} ${zone.bannerTo}`
    : 'bg-gradient-to-br from-gray-600 to-gray-800';

  return (
    <div className="max-w-2xl space-y-6">

      {/* ══════════════════════════════════════════════════
          SECTION 1 — Profile Hero Card
      ══════════════════════════════════════════════════ */}
      <div className="rounded-3xl overflow-hidden shadow-md border border-gray-100 bg-white">

        {/* Gradient banner */}
        <div className={`${bannerGradient} h-32 relative`}>
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute top-4 right-16 h-16 w-16 rounded-full bg-white/10" />
          {/* Zone label in banner */}
          {zone && (
            <div className="absolute bottom-3 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-base">{zone.emoji}</span>
              <span className="text-xs font-bold text-white">{zone.label}</span>
            </div>
          )}
        </div>

        {/* Avatar + identity row */}
        <div className="px-6 pt-0 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-5">
            {/* Avatar */}
            <div className={`h-24 w-24 rounded-2xl ${avatarBg(user?.name)} flex items-center justify-center
              text-white text-4xl font-extrabold border-4 border-white shadow-xl shrink-0 select-none`}>
              {user?.name?.[0]?.toUpperCase() ?? 'E'}
            </div>
            {/* Name block — padded so it sits below the banner edge */}
            <div className="pt-10">
              <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{user?.name}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Info chips row */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              👷 Employee
            </span>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
              user?.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {user?.isActive ? '🟢 Active' : '🔴 Inactive'}
            </span>
            {zone && (
              <span className={`flex items-center gap-1.5 ${zone.infoBg} ${zone.infoText} text-xs font-semibold px-3 py-1.5 rounded-full`}>
                {zone.emoji} {zone.label}
              </span>
            )}
            {user?.createdAt && (
              <span className="flex items-center gap-1.5 bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                📅 Since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — Performance Stats
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
          📊 Performance
        </h3>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon="📋" value={tasks.length}     label="Total Tasks"   valueClass="text-gray-700"   />
          <StatTile icon="✅" value={completed.length} label="Completed"     valueClass="text-green-600"  />
          <StatTile icon="🔄" value={active.length}    label="Active"        valueClass="text-blue-600"   />
          <StatTile icon="🔥" value={streak}           label="Day Streak"    valueClass="text-orange-500" />
        </div>

        {/* Completion rate progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Task Completion Rate</span>
            <span className="text-sm font-extrabold text-green-600">{rate}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700 ease-out"
              style={{ width: `${rate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>{completed.length} of {tasks.length} tasks completed</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — Zone Information
      ══════════════════════════════════════════════════ */}
      {zone && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
            🗺️ Zone Information
          </h3>

          {/* Zone hero strip */}
          <div className={`${zone.zoneBg} ${zone.zoneBorder} border rounded-2xl p-4 flex items-center gap-4`}>
            <div className={`${zone.avatarBg} h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm`}>
              {zone.emoji}
            </div>
            <div>
              <p className={`text-lg font-extrabold ${zone.zoneTitle}`}>{zone.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{zone.desc}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoTile label="Coordinates" value={zone.coords}   bg={zone.zoneBg} text={zone.zoneText} />
            <InfoTile label="Population"  value={zone.pop}      bg={zone.zoneBg} text={zone.zoneText} />
            <InfoTile label="District"    value={zone.district} bg={zone.zoneBg} text={zone.zoneText} />
            <InfoTile label="Notable"     value={zone.note}     bg={zone.zoneBg} text={zone.zoneText} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SECTION 4 — Recent Task History
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
          🕐 Recent Task History
        </h3>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="text-4xl mb-2">📭</span>
            <p className="text-gray-400 text-sm font-medium">No tasks assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...tasks]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 8)
              .map(task => (
                <div key={task._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  {/* Left */}
                  <div className="flex items-center gap-3">
                    {/* Status dot */}
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      task.status === 'Completed'   ? 'bg-green-500' :
                      task.status === 'In-Progress' ? 'bg-blue-500'  : 'bg-yellow-400'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-800">{task.binId}</span>
                        <span className="text-xs font-mono text-gray-400">{task.taskId}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(task.timestamp).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  {/* Right */}
                  <StatusBadge status={task.status} />
                </div>
              ))
            }
          </div>
        )}
      </div>

    </div>
  );
}
