import FillBar from './FillBar';
import StatusBadge from './StatusBadge';

export default function CriticalAlertsTable({ bins = [], onAssign, loading }) {
  if (loading) {
    return (
      <div className="card space-y-3">
        {[1, 2, 3].map((row) => (
          <div key={row} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (bins.length === 0) {
    return (
      <div className="card text-center py-10">
        <span className="text-3xl">✅</span>
        <p className="mt-2 text-sm text-gray-500">No critical bins right now.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            <th className="px-3 py-3 font-medium">Bin</th>
            <th className="px-3 py-3 font-medium">Location</th>
            <th className="px-3 py-3 font-medium">Fill level</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Last updated</th>
            <th className="px-3 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bins.map((bin) => (
            <tr key={bin._id} className="hover:bg-gray-50">
              <td className="px-3 py-4 font-mono font-semibold text-gray-800">{bin.binId}</td>
              <td className="px-3 py-4 text-gray-500">
                {bin.location.lat.toFixed(5)}, {bin.location.lng.toFixed(5)}
              </td>
              <td className="px-3 py-4">
                <div className="w-32">
                  <FillBar percentage={bin.fillPercentage} />
                </div>
              </td>
              <td className="px-3 py-4"><StatusBadge status={bin.status} /></td>
              <td className="px-3 py-4 text-gray-500">
                {new Date(bin.lastUpdated).toLocaleString()}
              </td>
              <td className="px-3 py-4">
                {bin.openTasks?.length > 0 ? (
                  <span className="text-xs text-blue-600">
                    {bin.openTasks.length} open task(s)
                  </span>
                ) : (
                  <button onClick={() => onAssign(bin)} className="btn-danger text-xs px-3 py-1.5">
                    Assign task
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
