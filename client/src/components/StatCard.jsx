export default function StatCard({ title, value, icon, color = 'text-primary-600', bg = 'bg-primary-50' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`${bg} p-3 rounded-xl`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}
