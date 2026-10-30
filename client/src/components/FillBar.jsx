import { THRESHOLDS, barColor } from '../config/thresholds';

export default function FillBar({ percentage }) {
  const pct = Math.min(Math.max(percentage ?? 0, 0), 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Fill level</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`${barColor(pct)} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
        {/* tick marks where alerts fire: 50 / 60 / 90 */}
        {[THRESHOLDS.HALF, THRESHOLDS.WARNING, THRESHOLDS.CRITICAL].map((t) => (
          <span
            key={t}
            className="absolute top-0 h-2.5 w-px bg-gray-500/40"
            style={{ left: `${t}%` }}
            title={`${t}%`}
          />
        ))}
      </div>
    </div>
  );
}
