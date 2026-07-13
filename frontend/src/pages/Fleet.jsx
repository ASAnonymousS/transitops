import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Modal from '../components/Modal';
import Chip, { Plate } from '../components/Chip';
import { VEHICLE_TYPES, VEHICLE_STATUSES } from '../data/mockData';

const EMPTY = { reg: '', name: '', type: 'Van', maxLoad: '', odometer: '', acqCost: '', status: 'Available', region: '' };

function VehicleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.reg.trim() || !form.name.trim() || !form.maxLoad || !form.acqCost) {
      setError('Please fill in all required fields.');
      return;
    }
    const res = onSave(form);
    if (res && !res.ok) setError(res.error);
  };

  return (
    <form onSubmit={submit}>
      <div className="grid two">
        <div className="fld"><label>Registration no. (unique)</label>
          <input value={form.reg} onChange={(e) => set('reg', e.target.value)} placeholder="GJ01 AB 1234" /></div>
        <div className="fld"><label>Name / model</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="VAN-06" /></div>
      </div>
      <div className="grid two">
        <div className="fld"><label>Type</label>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}>
            {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select></div>
        <div className="fld"><label>Region / depot</label>
          <input value={form.region} onChange={(e) => set('region', e.target.value)} placeholder="Gandhinagar" /></div>
      </div>
      <div className="grid two">
        <div className="fld"><label>Max load capacity (kg)</label>
          <input type="number" value={form.maxLoad} onChange={(e) => set('maxLoad', e.target.value)} /></div>
        <div className="fld"><label>Odometer (km)</label>
          <input type="number" value={form.odometer} onChange={(e) => set('odometer', e.target.value)} /></div>
      </div>
      <div className="grid two">
        <div className="fld"><label>Acquisition cost (₹)</label>
          <input type="number" value={form.acqCost} onChange={(e) => set('acqCost', e.target.value)} /></div>
        <div className="fld"><label>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)}
            disabled={form.status === 'On Trip' || form.status === 'In Shop'}>
            {VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {(form.status === 'On Trip' || form.status === 'In Shop') &&
            <div className="hint">Status is managed automatically by trips/maintenance workflows.</div>}
        </div>
      </div>
      {error && <div className="alert err" style={{ marginBottom: 14 }}>✕ {error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn pri" type="submit">Save vehicle</button>
        <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Fleet() {
  const { vehicles, addVehicle, updateVehicle, canEdit } = useApp();
  const editable = canEdit('fleet');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => vehicles.filter((v) =>
    v.reg.toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === 'All' || v.type === typeFilter) &&
    (statusFilter === 'All' || v.status === statusFilter)
  ), [vehicles, search, typeFilter, statusFilter]);

  return (
    <Shell
      title="Vehicle registry"
      search={<div className="search"><input placeholder="Search reg. no…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>}
      actions={<>
        <select className="btn ghost" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>Type</option>{VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="btn ghost" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>Status</option>{VEHICLE_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {editable && <button className="btn pri" onClick={() => setShowAdd(true)}>＋ Add vehicle</button>}
      </>}
    >
      <div className="card">
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Reg. no. (unique)</th><th>Name / model</th><th>Type</th><th>Max load</th>
                <th>Odometer</th><th>Acq. cost</th><th>Status</th>{editable && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} style={v.status === 'Retired' ? { opacity: .55 } : undefined}>
                  <td><Plate>{v.reg}</Plate></td>
                  <td>{v.name}</td>
                  <td>{v.type}</td>
                  <td className="num">{v.maxLoad.toLocaleString()} kg</td>
                  <td className="num">{v.odometer.toLocaleString()} km</td>
                  <td className="num">₹{v.acqCost.toLocaleString('en-IN')}</td>
                  <td><Chip status={v.status} /></td>
                  {editable && <td><button className="linkbtn" onClick={() => setEditing(v)}>Edit</button></td>}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty">No vehicles match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal title="Add vehicle" subtitle="Register a new vehicle to the fleet" onClose={() => setShowAdd(false)} width={560}>
          <VehicleForm
            onSave={(data) => { const res = addVehicle(data); if (res.ok) setShowAdd(false); return res; }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editing && (
        <Modal title={`Edit ${editing.name}`} subtitle={editing.reg} onClose={() => setEditing(null)} width={560}>
          <VehicleForm
            initial={editing}
            onSave={(data) => { const res = updateVehicle(editing.id, data); if (res.ok) setEditing(null); return res; }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}
    </Shell>
  );
}
