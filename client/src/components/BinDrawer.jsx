import { useEffect, useRef } from 'react';
import FillBar from './FillBar';
import StatusBadge from './StatusBadge';

/**
 * BinDrawer — slide-in panel showing bins for a given status filter.
 * Props:
 *   isOpen   – boolean
 *   onClose  – fn
 *   title    – string  e.g. "Critical Bins"
 *   bins     – filtered bin array
 *   onAssign – optional (bin) => void  shown for Critical bins
 */
export default function BinDrawer({ isOpen, onClose, title, bins = [], onAssign }) {
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap — move focus into panel when it opens
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col
          transform transition-transform duration-300 ease-in-out outline-none
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{bins.length} bin{bins.length !== 1 ? 's' : ''}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Bin list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {bins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <span className="text-4xl mb-2">✅</span>
              <p className="text-gray-400 text-sm">No bins in this category.</p>
            </div>
          ) : (
            bins.map((bin) => (
              <div
                key={bin._id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3 hover:shadow-sm transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-bold text-gray-800 text-sm">{bin.binId}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📍 {bin.location.lat.toFixed(5)}, {bin.location.lng.toFixed(5)}
                    </p>
                  </div>
                  <StatusBadge status={bin.status} />
                </div>

                {/* Fill bar */}
                <FillBar percentage={bin.fillPercentage} />

                {/* Bottom row */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400">
                    Updated: {new Date(bin.lastUpdated).toLocaleString()}
                  </p>
                  {onAssign && bin.status === 'Critical' && (
                    <button
                      onClick={() => { onClose(); onAssign(bin); }}
                      className="btn-danger text-xs px-3 py-1.5"
                    >
                      🚛 Assign Task
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
