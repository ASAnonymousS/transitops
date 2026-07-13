import { useApp } from '../context/AppContext';

const CLASS_MAP = { ok: 'alert ok', warn: 'alert warn', err: 'alert err' };

export default function Toasts() {
  const { toasts } = useApp();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${CLASS_MAP[t.kind] || 'alert ok'}`}>{t.message}</div>
      ))}
    </div>
  );
}
