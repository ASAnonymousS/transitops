import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Modal from '../components/Modal';
import { Plate } from '../components/Chip';

function LogFuelModal({ onClose }) {
  const { vehicles, addFuelLog } = useApp();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [date, setDate] = useState('2026-07-12');
  const [liters, setLiters] = useState('');
  const [cost, setCost] = useState('');
  const [tripId, setTripId] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!vehicleId || !liters || !cost) { setError('Fill in vehicle, liters and cost.'); return; }
    addFuelLog({ vehicleId, date, liters, cost, tripId: tripId || null });
    onClose();
  };

  return (
    <Modal title="Log fuel" onClose={onClose} width={420}>
      <form onSubmit={submit}>
        <div className="fld"><label>Vehicle</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.reg}</option>)}
          </select></div>
        <div className="grid two">
          <div className="fld"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="fld"><label>Trip (optional)</label><input type="number" value={tripId} onChange={(e) => setTripId(e.target.value)} placeholder="e.g. 1" /></div>
        </div>
        <div className="grid two">
          <div className="fld"><label>Liters</label><input type="number" value={liters} onChange={(e) => setLiters(e.target.value)} /></div>
          <div className="fld"><label>Cost (₹)</label><input type="number" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
        </div>
        {error && <div className="alert err" style={{ marginBottom: 14 }}>✕ {error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn pri" type="submit">Save fuel log</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function AddExpenseModal({ onClose }) {
  const { vehicles, addExpense } = useApp();
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [date, setDate] = useState('2026-07-12');
  const [toll, setToll] = useState('');
  const [other, setOther] = useState('');
  const [tripId, setTripId] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!vehicleId || (!toll && !other)) { setError('Fill in vehicle and at least one cost.'); return; }
    addExpense({ vehicleId, date, toll, other, tripId: tripId || null });
    onClose();
  };

  return (
    <Modal title="Add expense" onClose={onClose} width={420}>
      <form onSubmit={submit}>
        <div className="fld"><label>Vehicle</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.reg}</option>)}
          </select></div>
        <div className="grid two">
          <div className="fld"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="fld"><label>Trip (optional)</label><input type="number" value={tripId} onChange={(e) => setTripId(e.target.value)} placeholder="e.g. 1" /></div>
        </div>
        <div className="grid two">
          <div className="fld"><label>Toll (₹)</label><input type="number" value={toll} onChange={(e) => setToll(e.target.value)} /></div>
          <div className="fld"><label>Other (₹)</label><input type="number" value={other} onChange={(e) => setOther(e.target.value)} /></div>
        </div>
        {error && <div className="alert err" style={{ marginBottom: 14 }}>✕ {error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn pri" type="submit">Save expense</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function FuelExpenses() {
  const { fuelLogs, expenses, vehicleById, totalOperationalCost, canEdit } = useApp();
  const editable = canEdit('fuel');
  const [logFuel, setLogFuel] = useState(false);
  const [addExp, setAddExp] = useState(false);

  return (
    <Shell
      title="Fuel & expenses"
      actions={editable && <>
        <button className="btn" onClick={() => setLogFuel(true)}>＋ Log fuel</button>
        <button className="btn pri" onClick={() => setAddExp(true)}>＋ Add expense</button>
      </>}
    >
      <div className="grid two">
        <div className="card">
          <h3>Fuel logs</h3>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost</th><th>Trip</th></tr></thead>
              <tbody>
                {fuelLogs.map((f) => {
                  const v = vehicleById(f.vehicleId);
                  return (
                    <tr key={f.id}>
                      <td>{v && <Plate>{v.reg}</Plate>}</td>
                      <td className="num">{new Date(f.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="num">{f.liters} L</td>
                      <td className="num">₹{f.cost.toLocaleString('en-IN')}</td>
                      <td className="num">{f.tripId || '—'}</td>
                    </tr>
                  );
                })}
                {fuelLogs.length === 0 && <tr><td colSpan={5} className="empty">No fuel logs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Other expenses · toll / misc</h3>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Trip</th><th>Vehicle</th><th>Toll</th><th>Other</th><th>Total</th></tr></thead>
              <tbody>
                {expenses.map((e) => {
                  const v = vehicleById(e.vehicleId);
                  return (
                    <tr key={e.id}>
                      <td className="num">{e.tripId || '—'}</td>
                      <td>{v && <Plate>{v.reg}</Plate>}</td>
                      <td className="num">₹{e.toll.toLocaleString('en-IN')}</td>
                      <td className="num">₹{e.other.toLocaleString('en-IN')}</td>
                      <td className="num"><b>₹{(e.toll + e.other).toLocaleString('en-IN')}</b></td>
                    </tr>
                  );
                })}
                {expenses.length === 0 && <tr><td colSpan={5} className="empty">No expenses yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card span2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderColor: 'var(--amber)' }}>
          <span style={{ font: "600 11px 'Inter'", textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)' }}>
            Total operational cost (auto) = Fuel + Maintenance
          </span>
          <span className="disp" style={{ fontSize: 30, fontWeight: 600, color: 'var(--amber)' }}>
            ₹{totalOperationalCost.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {logFuel && <LogFuelModal onClose={() => setLogFuel(false)} />}
      {addExp && <AddExpenseModal onClose={() => setAddExp(false)} />}
    </Shell>
  );
}
