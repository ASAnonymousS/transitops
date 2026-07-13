import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Modal from '../components/Modal';
import Chip, { Plate } from '../components/Chip';

const LIFECYCLE = ['Draft', 'Dispatched', 'Completed'];

function LifecycleSteps({ status }) {
  const cancelled = status === 'Cancelled';
  const idx = LIFECYCLE.indexOf(status);
  return (
    <div className="steps" style={{ marginBottom: 0 }}>
      {LIFECYCLE.map((step, i) => {
        let cls = '';
        if (!cancelled && i < idx) cls = 'done';
        else if (!cancelled && i === idx) cls = 'now';
        return (
          <span key={step} className={`st ${cls}`.trim()}>
            <span className="dot">{cls === 'done' ? '✓' : cls === 'now' ? '●' : ''}</span>{step}
            {i < LIFECYCLE.length - 1 && <span className="ln" />}
          </span>
        );
      })}
      {cancelled && (
        <span className="st cancelled"><span className="ln" /><span className="dot">✕</span>Cancelled</span>
      )}
    </div>
  );
}

function CreateTripForm({ onDone }) {
  const { dispatchableVehicles, eligibleDrivers, validateTrip, createTrip, vehicleById } = useApp();
  const [source, setSource] = useState('Gandhinagar Depot');
  const [destination, setDestination] = useState('Ahmedabad Hub');
  const [vehicleId, setVehicleId] = useState(dispatchableVehicles[0]?.id || '');
  const [driverId, setDriverId] = useState(eligibleDrivers[0]?.id || '');
  const [cargoWeight, setCargoWeight] = useState('');
  const [distance, setDistance] = useState('');
  const [formError, setFormError] = useState('');

  const vehicle = vehicleById(vehicleId);
  const check = useMemo(() => {
    if (!vehicleId || !driverId) return null;
    return validateTrip(vehicleId, driverId, cargoWeight);
  }, [vehicleId, driverId, cargoWeight, validateTrip]);

  const submit = async (dispatchNow) => {
    if (!source.trim() || !destination.trim() || !distance) {
      setFormError('Please fill in source, destination and distance.');
      return;
    }
    setFormError('');
    const res = await createTrip({ source, destination, vehicleId, driverId, cargoWeight, distance }, dispatchNow);
    if (res.ok) {
      onDone();
    } else {
      setFormError(res.error || 'Failed to submit trip request.');
    }
  };

  return (
    <div className="card">
      <h3>Create trip</h3>
      <div className="grid two">
        <div className="fld"><label>Source</label><input value={source} onChange={(e) => setSource(e.target.value)} /></div>
        <div className="fld"><label>Destination</label><input value={destination} onChange={(e) => setDestination(e.target.value)} /></div>
      </div>
      <div className="fld">
        <label>Vehicle · available only</label>
        <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          <option value="">— select vehicle —</option>
          {dispatchableVehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.name} — {v.reg} — cap. {v.maxLoad.toLocaleString()} kg</option>
          ))}
        </select>
        <div className="hint">In Shop, Retired &amp; On Trip vehicles are not listed ({dispatchableVehicles.length} available now)</div>
      </div>
      <div className="fld">
        <label>Driver · eligible only</label>
        <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
          <option value="">— select driver —</option>
          {eligibleDrivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name} — {d.lic} — safety {d.safety}</option>
          ))}
        </select>
        <div className="hint">Expired-license, Suspended &amp; On Trip drivers are not listed ({eligibleDrivers.length} eligible now)</div>
      </div>
      <div className="grid two">
        <div className="fld"><label>Cargo weight (kg)</label>
          <input type="number" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} placeholder={vehicle ? `max ${vehicle.maxLoad}` : ''} /></div>
        <div className="fld"><label>Planned distance (km)</label>
          <input type="number" value={distance} onChange={(e) => setDistance(e.target.value)} /></div>
      </div>

      {check && (
        <div className={`alert ${check.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>
          {check.ok ? '✓' : '✕'} {check.ok ? check.message : check.error}
        </div>
      )}
      {formError && <div className="alert err" style={{ marginBottom: 14 }}>✕ {formError}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className={`btn pri${!check?.ok ? ' dis' : ''}`} disabled={!check?.ok} onClick={() => submit(true)}>
          Dispatch trip
        </button>
        <button className="btn ghost" onClick={() => submit(false)}>Save as draft</button>
      </div>
    </div>
  );
}

function CompleteTripModal({ trip, onClose }) {
  const { completeTrip, vehicleById } = useApp();
  const vehicle = vehicleById(trip.vehicleId);
  const [finalOdometer, setFinalOdometer] = useState(vehicle ? vehicle.odometer + trip.distance : '');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!finalOdometer || Number(finalOdometer) < (vehicle?.odometer || 0)) {
      setError(`Final odometer must be ≥ current odometer (${vehicle?.odometer.toLocaleString()} km).`);
      return;
    }
    const res = await completeTrip(trip.id, finalOdometer, fuelConsumed || 0, fuelCost || 0);
    if (res.ok) onClose();
    else setError(res.error);
  };

  return (
    <Modal title={`Complete ${trip.id}`} subtitle={`${trip.source} → ${trip.destination}`} onClose={onClose} width={440}>
      <form onSubmit={submit}>
        <div className="fld"><label>Final odometer (km)</label>
          <input type="number" value={finalOdometer} onChange={(e) => setFinalOdometer(e.target.value)} /></div>
        <div className="grid two">
          <div className="fld"><label>Fuel consumed (L)</label>
            <input type="number" value={fuelConsumed} onChange={(e) => setFuelConsumed(e.target.value)} /></div>
          <div className="fld"><label>Fuel cost (₹)</label>
            <input type="number" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} /></div>
        </div>
        {error && <div className="alert err" style={{ marginBottom: 14 }}>✕ {error}</div>}
        <div className="rule" style={{ marginBottom: 14 }}>
          <b>On complete:</b> odometer → fuel log → vehicle &amp; driver back to Available.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn pri" type="submit">Mark completed</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

function DispatchDraftModal({ trip, onClose }) {
  const { dispatchableVehicles, eligibleDrivers, validateTrip, dispatchTrip } = useApp();
  const [vehicleId, setVehicleId] = useState(trip.vehicleId || dispatchableVehicles[0]?.id || '');
  const [driverId, setDriverId] = useState(trip.driverId || eligibleDrivers[0]?.id || '');

  const check = useMemo(
    () => (vehicleId && driverId ? validateTrip(vehicleId, driverId, trip.cargoWeight) : null),
    [vehicleId, driverId, trip.cargoWeight, validateTrip]
  );

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatchTrip(trip.id, vehicleId, driverId);
    if (res.ok) onClose();
  };

  return (
    <Modal title={`Dispatch ${trip.id}`} subtitle={`${trip.source} → ${trip.destination} · cargo ${trip.cargoWeight} kg`} onClose={onClose} width={440}>
      <form onSubmit={submit}>
        <div className="fld"><label>Vehicle · available only</label>
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">— select vehicle —</option>
            {dispatchableVehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.reg} — cap. {v.maxLoad.toLocaleString()} kg</option>)}
          </select></div>
        <div className="fld"><label>Driver · eligible only</label>
          <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">— select driver —</option>
            {eligibleDrivers.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.lic} — safety {d.safety}</option>)}
          </select></div>
        {check && <div className={`alert ${check.ok ? 'ok' : 'err'}`} style={{ marginBottom: 14 }}>{check.ok ? '✓' : '✕'} {check.ok ? check.message : check.error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={`btn pri${!check?.ok ? ' dis' : ''}`} disabled={!check?.ok} type="submit">Dispatch trip</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Trips() {
  const { trips, vehicleById, driverById, cancelTrip, dispatchableVehicles, eligibleDrivers, canEdit } = useApp();
  const editable = canEdit('trips');
  const [completing, setCompleting] = useState(null);
  const [dispatching, setDispatching] = useState(null);
  const [focusTrip, setFocusTrip] = useState(null);

  const liveBoard = useMemo(() => [...trips].sort((a, b) => {
    const order = { Dispatched: 0, Draft: 1, Completed: 2, Cancelled: 3 };
    return order[a.status] - order[b.status];
  }), [trips]);

  return (
    <Shell title="Trip dispatcher">
      <div className={`grid${editable ? ' split-13' : ''}`}>
        {editable && <CreateTripForm onDone={() => {}} />}

        <div>
          {focusTrip && (
            <div className="card" style={{ marginBottom: 14 }}>
              <h3>Trip lifecycle · {focusTrip.id}</h3>
              <LifecycleSteps status={focusTrip.status} />
            </div>
          )}
          <div className="card">
            <h3>Live board</h3>
            {liveBoard.map((t) => {
              const v = vehicleById(t.vehicleId);
              const d = driverById(t.driverId);
              return (
                <div key={t.id} className="tripcard" onClick={() => setFocusTrip(t)} style={{ cursor: 'pointer' }}>
                  <div className="hd">
                    <b className="num">
                      {t.id} · {v ? <Plate>{v.reg}</Plate> : 'unassigned'} {d ? `/ ${d.name}` : ''}
                    </b>
                    <Chip status={t.status} />
                  </div>
                  <div className="meta">
                    {t.source} → {t.destination} · {t.status === 'Dispatched' ? 'ETA in transit' : t.status === 'Completed' ? `${t.finalOdometer?.toLocaleString()} km final` : 'awaiting dispatch'}
                  </div>
                  {editable && (t.status === 'Draft' || t.status === 'Dispatched') && (
                    <div className="acts" onClick={(e) => e.stopPropagation()}>
                      {t.status === 'Draft' && (
                        <button className="btn sm" onClick={() => setDispatching(t)} disabled={!dispatchableVehicles.length || !eligibleDrivers.length}>Dispatch</button>
                      )}
                      {t.status === 'Dispatched' && (
                        <button className="btn sm pri" onClick={() => setCompleting(t)}>Complete</button>
                      )}
                      <button className="btn sm danger" onClick={() => cancelTrip(t.id)}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
            {liveBoard.length === 0 && <div className="empty">No trips yet.</div>}
          </div>
        </div>
      </div>

      {completing && <CompleteTripModal trip={completing} onClose={() => setCompleting(null)} />}
      {dispatching && <DispatchDraftModal trip={dispatching} onClose={() => setDispatching(null)} />}
    </Shell>
  );
}