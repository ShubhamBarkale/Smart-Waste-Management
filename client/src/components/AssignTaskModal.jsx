import { useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import FillBar from './FillBar';
import { getAllUsers } from '../services/userService';
import { createTask, assignTask } from '../services/taskService';

/**
 * AssignTaskModal
 * Props:
 *   bin        – the critical bin object (or null to close)
 *   onClose    – close handler
 *   onSuccess  – called after a task is successfully dispatched
 */
export default function AssignTaskModal({ bin, onClose, onSuccess }) {
  const [employees, setEmployees]     = useState([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [loadingEmps, setLoadingEmps] = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  // Fetch available employees every time the modal opens
  useEffect(() => {
    if (!bin) return;
    setSelectedEmp('');
    setError('');
    setLoadingEmps(true);
    getAllUsers('employee')
      .then((res) => setEmployees(res.data))
      .catch(() => setError('Could not load employees. Please try again.'))
      .finally(() => setLoadingEmps(false));
  }, [bin]);

  const handleDispatch = async () => {
    if (!selectedEmp) {
      setError('Please select an employee before dispatching.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // Create a pending task for this bin, then immediately assign it
      const taskRes = await createTask({ binId: bin.binId });
      await assignTask(taskRes.data.taskId, selectedEmp);
      onSuccess?.(`Task dispatched to ${employees.find((e) => e._id === selectedEmp)?.name}.`);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Dispatch failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!bin) return null;

  return (
    <Modal isOpen={!!bin} onClose={onClose} title="Dispatch Collection Task">
      {/* Bin summary */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-800 font-mono">{bin.binId}</span>
          <span className="badge-critical">Critical</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          📍 {bin.location.lat.toFixed(5)}, {bin.location.lng.toFixed(5)}
        </p>
        <FillBar percentage={bin.fillPercentage} />
      </div>

      {/* Employee selector */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="emp-select">
          Assign to Employee
        </label>
        {loadingEmps ? (
          <Spinner size="sm" />
        ) : employees.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No employees found.</p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {employees.map((emp) => (
              <label
                key={emp._id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedEmp === emp._id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="employee"
                  value={emp._id}
                  checked={selectedEmp === emp._id}
                  onChange={() => { setSelectedEmp(emp._id); setError(''); }}
                  className="accent-primary-600"
                />
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                    {emp.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                    <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                  </div>
                </div>
                {!emp.isActive && (
                  <span className="text-xs text-gray-400 italic shrink-0">Inactive</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary" disabled={submitting}>
          Cancel
        </button>
        <button
          onClick={handleDispatch}
          disabled={submitting || !selectedEmp || loadingEmps}
          className="btn-primary"
        >
          {submitting ? 'Dispatching…' : '🚛 Dispatch'}
        </button>
      </div>
    </Modal>
  );
}
