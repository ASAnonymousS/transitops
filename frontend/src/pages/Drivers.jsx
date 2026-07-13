import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Modal from '../components/Modal';
import Chip, { Plate } from '../components/Chip';
import { DRIVER_STATUSES } from '../data/mockData';

const EMPTY = { name: '', license: '', category: 'LMV', expiry: '', contact: '', status: 'Available' };

function DriverForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [error, setError] = useState('');
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.license.trim() || !form.expiry || !form.contact.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={submit}>
      <div className="grid two">
        <div className="fld"><label>Name</label><input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="fld"><label>License number</label><input value={form.license} onChange={(e) => set('license', e.target.value)} placeholder="DL-XXXXX" /></div>
      </div>
      <div className="grid two">
        <div className="fld"><label>License category</label>
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            <option>LMV</option><option>HMV</option>
          </select></div>
        <div className="fld"><label>License expiry date</label>
          <input type="date" value={form.expiry} onChange={(e) => set('expiry', e.target.value)} /></div>
      </div>
      <div className="grid two">
        <div className="fld"><label>Contact number</label><input value={form.contact} onChange={(e) => set('contact', e.target.value)} /></div>
        <div className="fld"><label>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} disabled={form.status === 'On Trip'}>
            {DRIVER_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {form.status === 'On Trip' && <div className="hint">Status is managed automatically by the trip workflow.</div>}
        </div>
      </div>
      {error && <div className="alert err" style={{ marginBottom: 14 }}>✕ {error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn pri" type="submit">Save driver</button>
        <button className="btn ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function Drivers() {
  const { drivers, addDriver, updateDriver, setDriverStatus, isLicenseExpired, canEdit } = useApp();
  const editable = canEdit('drivers');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => drivers.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.license.toLowerCase().includes(search.toLowerCase())),
    [drivers, search]
  );

  return (
    <Shell
      title="Drivers & safety"
      search={<div className="search"><input placeholder="Search drivers…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>}
      actions={editable && <button className="btn pri" onClick={() => setShowAdd(true)}>＋ Add driver</button>}
    >
      <div className="card">
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Driver</th><th>License no.</th><th>Category</th><th>Expiry</th><th>Contact</th>
                <th>Trip compl.</th><th>Safety</th><th>Status</th>{editable && <th></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const expired = isLicenseExpired(d);
                return (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td><Plate dl>{d.license}</Plate></td>
                    <td>{d.category}</td>
                    <td>{expired
                      ? <Chip status="Expired" label={`Expired ${new Date(d.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}`} />
                      : <span className="num">{new Date(d.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })}</span>}
                    </td>
                    <td className="num">{d.contact}</td>
                    <td className="num">{d.tripCompletion}%</td>
                    <td>
                      <div className="hbar" style={{ gridTemplateColumns: '1fr 38px', margin: 0 }}>
                        <div className="tr"><i style={{ width: `${d.safety}%`, background: d.safety >= 90 ? 'var(--green)' : 'var(--orange)' }} /></div>
                        <span className="num">{d.safety}</span>
                      </div>
                    </td>
                    <td><Chip status={d.status} /></td>
                    {editable && <td><button className="linkbtn" onClick={() => setEditing(d)}>Edit</button></td>}
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={9} className="empty">No drivers found.</td></tr>}
            </tbody>
          </table>
        </div>
        
      </div>

      {showAdd && (
        <Modal title="Add driver" subtitle="Register a new driver profile" onClose={() => setShowAdd(false)} width={560}>
          <DriverForm onSave={(data) => { addDriver(data); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title={`Edit ${editing.name}`} subtitle={editing.license} onClose={() => setEditing(null)} width={560}>
          <DriverForm initial={editing} onSave={(data) => { updateDriver(editing.id, data); setEditing(null); }} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </Shell>
  );
}
