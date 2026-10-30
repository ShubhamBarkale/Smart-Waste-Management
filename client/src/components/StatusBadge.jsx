const map = {
  Normal:      'badge-normal',
  Warning:     'badge-warning',
  Critical:    'badge-critical',
  Pending:     'badge-pending',
  'In-Progress': 'badge-inprogress',
  Completed:   'badge-completed',
};

export default function StatusBadge({ status }) {
  return <span className={map[status] ?? 'badge-pending'}>{status}</span>;
}
