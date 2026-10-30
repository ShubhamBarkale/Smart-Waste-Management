import { useLive } from '../context/LiveContext';

/** Small header pill: connection state, mute toggle, desktop-notification opt-in. */
export default function LiveStatus() {
  const { connected, muted, toggleMuted, notifPermission, enableDesktop } = useLive();

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
          connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
        title={connected ? 'Receiving live sensor data' : 'Reconnecting to the server…'}
      >
        <span className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
        {connected ? 'Live' : 'Offline'}
      </span>

      <button
        onClick={toggleMuted}
        aria-pressed={muted}
        aria-label={muted ? 'Unmute alert sounds' : 'Mute alert sounds'}
        title={muted ? 'Alert sound is off' : 'Alert sound is on'}
        className="text-base px-1.5 py-1 rounded-lg hover:bg-gray-100"
      >
        {muted ? '🔕' : '🔔'}
      </button>

      {notifPermission === 'default' && (
        <button onClick={enableDesktop} className="text-xs text-gray-500 underline hover:text-gray-800">
          Enable desktop alerts
        </button>
      )}
    </div>
  );
}
