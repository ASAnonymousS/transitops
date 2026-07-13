import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import { RBAC } from '../data/mockData';

const MODULES = ['dashboard', 'fleet', 'drivers', 'compliance', 'trips', 'maintenance', 'fuel', 'analytics', 'settings'];
const LABELS = { dashboard: 'Dashboard', fleet: 'Fleet', drivers: 'Drivers', compliance: 'Compliance', trips: 'Trips', maintenance: 'Maintenance', fuel: 'Fuel & Expenses', analytics: 'Analytics', settings: 'Settings' };
const ROLES = Object.keys(RBAC);

function Cell({ level }) {
  if (level === 'edit') return <span className="chip c-green">Full</span>;
  if (level === 'view') return <span className="chip c-blue">View</span>;
  return <span className="num" style={{ color: 'var(--faint)' }}>—</span>;
}

export default function Settings() {
  const { user, pushToast } = useApp();
  const [depot, setDepot] = useState('Gandhinagar Depot GJ4');
  const [currency, setCurrency] = useState('INR (₹)');
  const [unit, setUnit] = useState('Kilometers');

  const save = (e) => {
    e.preventDefault();
    pushToast('Settings saved.');
  };

  const youCol = (role) => (role === user?.role ? { background: 'var(--raised)' } : undefined);

  return (
    <Shell title="Settings & access">
      <div style={{ display: 'grid', gap: 20 }}>
        <div className="card">
          <h3>General</h3>
          <form onSubmit={save}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, maxWidth: 1000, flexWrap: 'wrap' }}>
              <div className="grid three" style={{ flex: 1, minWidth: 480, gap: 16 }}>
                <div className="fld" style={{ marginBottom: 0 }}><label>Depot name</label><input value={depot} onChange={(e) => setDepot(e.target.value)} /></div>
                <div className="fld" style={{ marginBottom: 0 }}><label>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}><option>INR (₹)</option><option>USD ($)</option></select></div>
                <div className="fld" style={{ marginBottom: 0 }}><label>Distance unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)}><option>Kilometers</option><option>Miles</option></select></div>
              </div>
              <button className="btn pri" type="submit">Save changes</button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3>Role-based access (RBAC)</h3>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  {ROLES.map((role) => (
                    <th key={role} style={youCol(role)}>
                      {role}
                      {role === user?.role && <span className="chip c-blue" style={{ marginLeft: 8 }}>You</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m}>
                    <td><b>{LABELS[m]}</b></td>
                    {ROLES.map((role) => (
                      <td key={role} style={youCol(role)}><Cell level={RBAC[role][m]} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </Shell>
  );
}