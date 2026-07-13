import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Chip, { Plate } from '../components/Chip';

export default function Maintenance() {
  const { vehicles, maintenance, addMaintenance, closeMaintenance, vehicleById, canEdit } = useApp();
  const editable = canEdit('maintenance');
  const eligibleVehicles = vehicles.filter((v) => v.status !== 'Retired');

  const [vehicleId, setVehicleId] = useState(eligibleVehicles[0]?.id || '');
  const [serviceType, setServiceType] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('2026-07-12');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!vehicleId || !serviceType.trim() || !cost) {
      setError('Please fill in vehicle, service type and cost.');
      return;
    }
    addMaintenance({ vehicleId, serviceType, cost, date, status });
    setServiceType(''); setCost(''); setError('');
  };

  return (
    <Shell title="Maintenance" actions={null}>
      <div className={`grid${editable ? ' split-14' : ''}`}>
        {editable && (
          <div className="card">
            <h3>New service record</h3>
            <form onSubmit={submit}>
              <div className="fld"><label>Vehicle</label>
                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  {eligibleVehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.reg}</option>)}
                </select></div>
              <div className="grid two">
                <div className="fld"><label>Service type</label>
                  <input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Oil change" /></div>
                <div className="fld"><label>Cost (₹)</label>
                  <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
              </div>
              <div className="grid two">
                <div className="fld"><label>Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="fld"><label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option>Active</option><option>Closed</option>
                  </select></div>
              </div>
              {error && <div className="alert err" style={{ marginBottom: 14 }}>✕ {error}</div>}
              <button className="btn pri" type="submit">Save record</button>
            </form>
            
          </div>
        )}
        <div className="card">
          <h3>Service log</h3>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Vehicle</th><th>Service</th><th>Cost</th><th>Record status</th><th>Vehicle status</th>{editable && <th></th>}</tr></thead>
              <tbody>
                {maintenance.map((m) => {
                  const v = vehicleById(m.vehicleId);
                  return (
                    <tr key={m.id}>
                      <td>{v ? <><Plate>{v.reg}</Plate> {v.name}</> : '—'}</td>
                      <td>{m.serviceType}</td>
                      <td className="num">₹{m.cost.toLocaleString('en-IN')}</td>
                      <td><Chip status={m.status} /></td>
                      <td>{v && <Chip status={v.status} />}</td>
                      {editable && <td>{m.status === 'Active' && <button className="linkbtn" onClick={() => closeMaintenance(m.id)}>Close</button>}</td>}
                    </tr>
                  );
                })}
                {maintenance.length === 0 && <tr><td colSpan={6} className="empty">No service records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
