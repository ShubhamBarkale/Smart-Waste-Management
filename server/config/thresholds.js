/**
 * SINGLE SOURCE OF TRUTH for bin fill levels (server side).
 * The client has a matching copy: client/src/config/thresholds.js  → keep both in sync.
 *
 *   fill <  50          → status Normal
 *   fill 50 – 89        → status Warning
 *   fill >= 90          → status Critical (bin is FULL → a collection task is auto-created)
 *
 * Alerts are fired when a bin crosses UP through 50, 60 or 90.
 */
const THRESHOLDS = Object.freeze({
  HALF: 50,       // "Half full"  – heads-up
  WARNING: 60,    // "Warning"    – plan a pickup
  CRITICAL: 90,   // "Full"       – dispatch now
});

const ALERT_LEVELS = [THRESHOLDS.HALF, THRESHOLDS.WARNING, THRESHOLDS.CRITICAL]; // ascending

// A noisy ultrasonic sensor can bounce around a threshold (59 → 60 → 59 → 60).
// The alert level only steps DOWN once the reading is this many points below it,
// so the same alert is not sent again and again.
const HYSTERESIS = 3;

const getStatus = (fill) => {
  if (fill >= THRESHOLDS.CRITICAL) return 'Critical';
  if (fill >= THRESHOLDS.HALF) return 'Warning';
  return 'Normal';
};

/** Highest alert level (0 | 50 | 60 | 90) for a fill value, with hysteresis. */
const nextAlertLevel = (fill, previousLevel = 0) => {
  let raw = 0;
  for (const level of ALERT_LEVELS) if (fill >= level) raw = level;
  if (raw < previousLevel && fill >= previousLevel - HYSTERESIS) return previousLevel;
  return raw;
};

module.exports = { THRESHOLDS, ALERT_LEVELS, HYSTERESIS, getStatus, nextAlertLevel };
