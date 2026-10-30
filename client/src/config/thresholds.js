/**
 * Bin fill levels — keep in sync with server/config/thresholds.js
 *
 *   < 50      Normal
 *   50 – 89   Warning   (alerts at 50 "Half full" and 60 "Warning")
 *   >= 90     Critical  (alert "Bin full" + collection task)
 */
export const THRESHOLDS = Object.freeze({ HALF: 50, WARNING: 60, CRITICAL: 90 });

export const getStatus = (fill) => {
  if (fill >= THRESHOLDS.CRITICAL) return 'Critical';
  if (fill >= THRESHOLDS.HALF) return 'Warning';
  return 'Normal';
};

// Level metadata used by FillBar colours and the live alert toasts
export const LEVELS = {
  50: { label: 'Half full', icon: '🟡', bar: 'bg-yellow-400', card: 'border-yellow-400 bg-yellow-50', text: 'text-yellow-800' },
  60: { label: 'Warning',   icon: '🟠', bar: 'bg-orange-500', card: 'border-orange-500 bg-orange-50', text: 'text-orange-800' },
  90: { label: 'Bin full',  icon: '🔴', bar: 'bg-red-500',    card: 'border-red-500 bg-red-50',       text: 'text-red-800' },
};

export const barColor = (pct) =>
  pct >= THRESHOLDS.CRITICAL ? LEVELS[90].bar :
  pct >= THRESHOLDS.WARNING  ? LEVELS[60].bar :
  pct >= THRESHOLDS.HALF     ? LEVELS[50].bar :
                               'bg-green-500';
