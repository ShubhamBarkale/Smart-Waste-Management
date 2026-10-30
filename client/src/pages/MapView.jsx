import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../context/LiveContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getAllBins } from '../services/binService';
import StatusBadge from '../components/StatusBadge';
import FillBar from '../components/FillBar';
import Spinner from '../components/Spinner';

// Custom colored marker icons per status
const iconFor = (status) => {
  const color = status === 'Critical' ? '#ef4444' : status === 'Warning' ? '#f59e0b' : '#22c55e';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function MapView() {
  const [bins, setBins]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const load = (silent = false) =>
    getAllBins()
      .then((res) => setBins(res.data))
      .catch(() => { if (!silent) setError('Failed to load bins.'); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []); // eslint-disable-line
  useLiveRefresh(() => load(true)); // markers change colour live

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-500">{error}</p>;

  // Default center: world view or first bin
  const center = bins.length
    ? [bins[0].location.lat, bins[0].location.lng]
    : [20, 0];

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="card flex gap-6 flex-wrap py-3">
        {[['Normal', '#22c55e'], ['Warning', '#f59e0b'], ['Critical', '#ef4444']].map(
          ([label, color]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block w-4 h-4 rounded-full border-2 border-white shadow"
                style={{ background: color }}
              />
              {label}
            </div>
          )
        )}
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden rounded-xl" style={{ height: '65vh' }}>
        <MapContainer center={center} zoom={bins.length ? 13 : 2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {bins.map((bin) => (
            <Marker
              key={bin._id}
              position={[bin.location.lat, bin.location.lng]}
              icon={iconFor(bin.status)}
            >
              <Popup>
                <div className="space-y-2 min-w-[160px]">
                  <p className="font-semibold">{bin.binId}</p>
                  <StatusBadge status={bin.status} />
                  <FillBar percentage={bin.fillPercentage} />
                  <p className="text-xs text-gray-400">
                    {new Date(bin.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
