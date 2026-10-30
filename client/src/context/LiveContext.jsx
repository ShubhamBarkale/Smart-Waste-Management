import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { LEVELS } from '../config/thresholds';

const LiveContext = createContext(null);
const MAX_TOASTS = 5;

/* ── helpers ─────────────────────────────────────────── */
const readMuted = () => {
  try { return localStorage.getItem('alertsMuted') === '1'; } catch { return false; }
};
const writeMuted = (v) => {
  try { localStorage.setItem('alertsMuted', v ? '1' : '0'); } catch { /* storage unavailable */ }
};

let audioCtx = null;
// 50% → one soft beep · 60% → two beeps · 90% → three higher beeps
function playBeep(level) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const count = level >= 90 ? 3 : level >= 60 ? 2 : 1;
    const freq  = level >= 90 ? 960 : level >= 60 ? 760 : 560;
    for (let i = 0; i < count; i++) {
      const t0 = audioCtx.currentTime + i * 0.22;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    }
  } catch { /* browsers may block audio before the first click */ }
}

/* ── provider ────────────────────────────────────────── */
export function LiveProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id ?? user?.id;
  const role = user?.role;

  const [connected, setConnected] = useState(false);
  const [toasts, setToasts]       = useState([]);
  const [muted, setMuted]         = useState(readMuted);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const mutedRef     = useRef(muted);
  const listenersRef = useRef(new Set());
  const timersRef    = useRef({});
  mutedRef.current = muted;

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback((alert) => {
    const id = `${alert.binId}-${Date.now()}`;
    setToasts((prev) => {
      // one toast per bin: a newer level replaces the older one
      const rest = prev.filter((t) => {
        if (t.binId === alert.binId) { clearTimeout(timersRef.current[t.id]); return false; }
        return true;
      });
      return [{ ...alert, id }, ...rest].slice(0, MAX_TOASTS);
    });
    // "Bin full" stays until dismissed; lower levels fade after 10 s
    if (alert.level < 90) timersRef.current[id] = setTimeout(() => dismiss(id), 10_000);
  }, [dismiss]);

  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  }, []);

  useEffect(() => {
    if (!userId) { setConnected(false); return undefined; }

    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
      auth: (cb) => cb({ token: localStorage.getItem('token') }),
    });

    let wasDown = false;
    socket.on('connect', () => {
      setConnected(true);
      if (wasDown) notifyListeners(); // catch up on anything missed while offline
    });
    socket.on('disconnect', () => { wasDown = true; setConnected(false); });
    socket.on('connect_error', () => { wasDown = true; setConnected(false); });

    socket.on('bin:update',  notifyListeners);
    socket.on('task:update', notifyListeners);

    socket.on('bin:alert', (alert) => {
      pushToast(alert);
      if (!mutedRef.current) playBeep(alert.level);
      if (alert.level >= 90 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification(`Bin ${alert.binId} is full`, { body: `${alert.fillPercentage}% — collection needed` }); }
        catch { /* some mobile browsers disallow the constructor */ }
      }
    });

    return () => { socket.disconnect(); };
  }, [userId, pushToast, notifyListeners]);

  useEffect(() => () => Object.values(timersRef.current).forEach(clearTimeout), []);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    writeMuted(next);
  };

  const enableDesktop = async () => {
    if (typeof Notification === 'undefined') return;
    setNotifPermission(await Notification.requestPermission());
  };

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  const alertsLink = role === 'admin' ? '/admin/alerts' : '/emp/tasks';
  const alertsLinkText = role === 'admin' ? 'Open alerts' : 'My tasks';

  return (
    <LiveContext.Provider value={{ connected, muted, toggleMuted, notifPermission, enableDesktop, subscribe }}>
      {children}

      {/* ── live alert toasts ── */}
      {userId && (
        <div
          className="fixed top-4 right-4 z-[2000] flex flex-col gap-3 w-[min(22rem,calc(100vw-2rem))]"
          aria-live="polite"
        >
          {toasts.map((t) => {
            const meta = LEVELS[t.level] ?? LEVELS[50];
            return (
              <div
                key={t.id}
                role={t.level >= 90 ? 'alert' : 'status'}
                className={`border-l-4 rounded-xl shadow-lg px-4 py-3 ${meta.card}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none mt-0.5" aria-hidden="true">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${meta.text}`}>
                      {meta.label}: <span className="font-mono">{t.binId}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {t.fillPercentage}% full
                      {t.level >= 90 && (t.taskCreated ? ' · collection task created' : ' · needs collection now')}
                    </p>
                    <Link
                      to={alertsLink}
                      onClick={() => dismiss(t.id)}
                      className={`inline-block text-xs font-medium underline mt-1.5 ${meta.text}`}
                    >
                      {alertsLinkText}
                    </Link>
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    aria-label={`Dismiss alert for ${t.binId}`}
                    className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </LiveContext.Provider>
  );
}

export const useLive = () => useContext(LiveContext);

/**
 * Re-run `callback` whenever the server pushes a bin/task change.
 * Debounced so a burst of sensor readings causes a single refresh.
 */
export function useLiveRefresh(callback) {
  const { subscribe } = useLive();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    let timer;
    const unsubscribe = subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), 400);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, [subscribe]);
}
