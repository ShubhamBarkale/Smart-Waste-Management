import { useEffect, useState } from 'react';
import { useLiveRefresh } from '../context/LiveContext';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getAllBins } from '../services/binService';
import { getAllTasks } from '../services/taskService';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';

const BIN_COLORS  = { Normal: '#22c55e', Warning: '#f59e0b', Critical: '#ef4444' };
const TASK_COLORS = { Pending: '#9ca3af', 'In-Progress': '#3b82f6', Completed: '#22c55e' };

export default function Analytics() {
  const [bins, setBins]     = useState([]);
  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    Promise.all([getAllBins(), getAllTasks()])
      .then(([b, t]) => { setBins(b.data); setTasks(t.data); })
      .catch(() => { /* keep showing the last data */ })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []); // eslint-disable-line
  useLiveRefresh(load);

  if (loading) return <Spinner />;

  // Bin status distribution for pie chart
  const binStatusData = Object.entries(
    bins.reduce((acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Task status distribution
  const taskStatusData = Object.entries(
    tasks.reduce((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // Fill percentage distribution (bucketed)
  const buckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
  bins.forEach((b) => {
    if (b.fillPercentage <= 25) buckets['0-25%']++;
    else if (b.fillPercentage <= 50) buckets['26-50%']++;
    else if (b.fillPercentage <= 75) buckets['51-75%']++;
    else buckets['76-100%']++;
  });
  const fillData = Object.entries(buckets).map(([name, count]) => ({ name, count }));

  const completionRate = tasks.length
    ? Math.round((tasks.filter((t) => t.status === 'Completed').length / tasks.length) * 100)
    : 0;

  const avgFill = bins.length
    ? Math.round(bins.reduce((s, b) => s + b.fillPercentage, 0) / bins.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Bins"        value={bins.length}       icon="🗑️" />
        <StatCard title="Total Tasks"       value={tasks.length}      icon="📋" bg="bg-blue-50"   color="text-blue-600" />
        <StatCard title="Task Completion"   value={`${completionRate}%`} icon="✅" bg="bg-green-50" color="text-green-600" />
        <StatCard title="Avg Fill Level"    value={`${avgFill}%`}     icon="📊" bg="bg-yellow-50" color="text-yellow-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bin status pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Bin Status Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={binStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {binStatusData.map((entry) => (
                  <Cell key={entry.name} fill={BIN_COLORS[entry.name] ?? '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task status bar */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Task Status Overview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={taskStatusData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {taskStatusData.map((entry) => (
                  <Cell key={entry.name} fill={TASK_COLORS[entry.name] ?? '#9ca3af'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fill percentage distribution */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Fill Level Distribution Across Bins</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fillData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Bins" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
