const COLOR_MAP = {
  Available: 'c-green',
  'On Trip': 'c-blue',
  Dispatched: 'c-blue',
  'In Shop': 'c-orange',
  Active: 'c-orange',
  Retired: 'c-grey',
  'Off Duty': 'c-grey',
  Draft: 'c-grey',
  Completed: 'c-green',
  Closed: 'c-green',
  Suspended: 'c-red',
  Cancelled: 'c-red',
  Expired: 'c-red',
};

const LIVE_STATUSES = new Set(['On Trip', 'Dispatched', 'Active']);

export default function Chip({ status, label }) {
  const cls = COLOR_MAP[status] || 'c-grey';
  const live = LIVE_STATUSES.has(status) ? ' live' : '';
  return <span className={`chip ${cls}${live}`}>{label || status}</span>;
}

export function Plate({ children, dl }) {
  return <span className={`plate${dl ? ' dl' : ''}`}>{children}</span>;
}
