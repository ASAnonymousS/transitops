import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Chip, { Plate } from '../components/Chip';
import { VEHICLE_TYPES } from '../data/mockData';

export default function Dashboard() {
  const { vehicles, drivers, trips, fleetUtilization } = useApp();
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');

  const regions = useMemo(() => ['All', ...new Set(vehicles.map((v) => v.region))], [vehicles]);

  const filteredVehicles = useMemo(() => vehicles.filter((v) =>
    (typeFilter === 'All' || v.type === typeFilter) &&
    (statusFilter === 'All' || v.status === statusFilter) &&
    (regionFilter === 'All' || v.region === regionFilter)
  ), [vehicles, typeFilter, statusFilter, regionFilter]);

  const activeVehicles = filteredVehicles.filter((v) => v.status !== 'Retired').length;
  const availableVehicles = filteredVehicles.filter((v) => v.status === 'Available').length;
  const inMaintenance = filteredVehicles.filter((v) => v.status === 'In Shop').length;
  const activeTrips = trips.filter((t) => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter((t) => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter((d) => d.status === 'On Trip' || d.status === 'Available').length;

  const statusBreakdown = ['Available', 'On Trip', 'In Shop', 'Retired'].map((status) => ({
    status,
    count: filteredVehicles.filter((v) => v.status === status).length,
  }));
  const maxCount = Math.max(1, ...statusBreakdown.map((s) => s.count));
  const colorFor = { Available: 'var(--green)', 'On Trip': 'var(--blue)', 'In Shop': 'var(--orange)', Retired: 'var(--grey)' };

  const recentTrips = [...trips].slice(0, 5);
  const { vehicleById, driverById } = useApp();

  return (
    <Shell title="Dashboard">
      <div className="strip" style={{ marginBottom: 14 }}>
        <span>Filters:</span>
        <label>Vehicle Type · <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>All</option>{VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select></label>
        <label>Status · <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option><option>Available</option><option>On Trip</option><option>In Shop</option><option>Retired</option>
        </select></label>
        <label>Region · <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          {regions.map((r) => <option key={r}>{r}</option>)}
        </select></label>
      </div>

      <div className="grid kpis" style={{ marginBottom: 14 }}>
        <div className="card kpi"><div className="n">{String(activeVehicles).padStart(2, '0')}</div><div className="l">Active vehicles</div></div>
        <div className="card kpi"><div className="n">{String(availableVehicles).padStart(2, '0')}</div><div className="l">Available vehicles</div></div>
        <div className="card kpi"><div className="n">{String(inMaintenance).padStart(2, '0')}</div><div className="l">Vehicles in maintenance</div></div>
        <div className="card kpi"><div className="n">{fleetUtilization}<span style={{ fontSize: 20 }}>%</span></div><div className="l">Fleet utilization</div>
          <div className="bar"><i style={{ width: `${fleetUtilization}%` }} /></div></div>
      </div>

      <div className="grid three" style={{ marginBottom: 14 }}>
        <div className="card kpi"><div className="n">{String(activeTrips).padStart(2, '0')}</div><div className="l">Active trips</div></div>
        <div className="card kpi"><div className="n">{String(pendingTrips).padStart(2, '0')}</div><div className="l">Pending trips</div></div>
        <div className="card kpi"><div className="n">{String(driversOnDuty).padStart(2, '0')}</div><div className="l">Drivers on duty</div></div>
      </div>

      <div className="grid split-17-1">
        <div className="card">
          <h3>Recent trips</h3>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th><th>ETA</th></tr></thead>
              <tbody>
                {recentTrips.map((t) => {
                  const v = vehicleById(t.vehicleId);
                  const d = driverById(t.driverId);
                  return (
                    <tr key={t.id}>
                      <td className="num">{t.id}</td>
                      <td>{v ? <Plate>{v.reg}</Plate> : '—'}</td>
                      <td>{d ? d.name : '—'}</td>
                      <td><Chip status={t.status} /></td>
                      <td className="num">{t.eta}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3>Vehicle status</h3>
          {statusBreakdown.map((s) => (
            <div className="hbar" key={s.status}>
              <span>{s.status}</span>
              <div className="tr"><i style={{ width: `${(s.count / maxCount) * 100}%`, background: colorFor[s.status] }} /></div>
              <span className="num">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
