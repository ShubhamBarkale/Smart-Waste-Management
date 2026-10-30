/**
 * SummaryCards
 * Renders four live stat cards derived from a bins array.
 * Props:
 *   bins     – array of bin objects from the API
 *   loading  – boolean
 */
export default function SummaryCards({ bins, loading }) {
  const total    = bins.length;
  const critical = bins.filter((b) => b.status === 'Critical').length;
  const warning  = bins.filter((b) => b.status === 'Warning').length;
  const normal   = bins.filter((b) => b.status === 'Normal').length;

  const cards = [
    {
      label: 'Total Bins',
      value: total,
      icon: '🗑️',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      textColor: 'text-slate-700',
      iconBg: 'bg-slate-100',
    },
    {
      label: 'Critical',
      value: critical,
      icon: '🔴',
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-600',
      iconBg: 'bg-red-100',
      pulse: critical > 0,
    },
    {
      label: 'Warning',
      value: warning,
      icon: '🟡',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      textColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Normal',
      value: normal,
      icon: '🟢',
      bg: 'bg-green-50',
      border: 'border-green-200',
      textColor: 'text-green-600',
      iconBg: 'bg-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon, bg, border, textColor, iconBg, pulse }) => (
        <div
          key={label}
          className={`relative rounded-2xl border ${bg} ${border} p-5 flex items-center gap-4 shadow-sm`}
        >
          {/* Pulse ring for critical when count > 0 */}
          {pulse && (
            <span className="absolute top-3 right-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          )}
          <div className={`${iconBg} p-3 rounded-xl text-2xl shrink-0`}>{icon}</div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            {loading ? (
              <div className="h-7 w-10 bg-gray-200 rounded animate-pulse mt-1" />
            ) : (
              <p className={`text-3xl font-bold ${textColor}`}>{value}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
