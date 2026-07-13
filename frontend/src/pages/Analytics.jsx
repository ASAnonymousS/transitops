import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';

function toCSV(rows) {
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCSV(filename, rows) {
  const blob = new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const { vehicles, revenue, fuelEfficiency, fleetUtilization, totalOperationalCost, overallROI, costByVehicle, vehicleById } = useApp();

  const topCostly = useMemo(() => {
    const list = vehicles.map((v) => {
      const c = costByVehicle[v.id] || { fuel: 0, maintenance: 0 };
      return { vehicle: v, total: c.fuel + c.maintenance };
    }).sort((a, b) => b.total - a.total).slice(0, 5);
    const max = Math.max(1, ...list.map((l) => l.total));
    return { list, max };
  }, [vehicles, costByVehicle]);

  const maxRevenue = Math.max(...revenue.map((r) => r.value));

  const exportCSV = () => {
    const rows = [
      ['Vehicle', 'Reg No', 'Type', 'Fuel Cost', 'Maintenance Cost', 'Total Cost'],
      ...vehicles.map((v) => {
        const c = costByVehicle[v.id] || { fuel: 0, maintenance: 0 };
        return [v.name, v.reg, v.type, c.fuel, c.maintenance, c.fuel + c.maintenance];
      }),
    ];
    downloadCSV('transitops-analytics.csv', rows);
  };

  return (
    <Shell title="Reports & analytics" actions={<button className="btn pri" onClick={exportCSV}>Export CSV</button>}>
      <div className="grid kpis" style={{ marginBottom: 14 }}>
        <div className="card kpi"><div className="n">{fuelEfficiency}</div><div className="l">Fuel efficiency · km/L</div><div className="d">distance ÷ fuel</div></div>
        <div className="card kpi"><div className="n">{fleetUtilization}%</div><div className="l">Fleet utilization</div><div className="bar"><i style={{ width: `${fleetUtilization}%` }} /></div></div>
        <div className="card kpi"><div className="n">₹{totalOperationalCost.toLocaleString('en-IN')}</div><div className="l">Operational cost</div></div>
        <div className="card kpi"><div className="n">{overallROI}%</div><div className="l">Vehicle ROI</div><div className="d">(revenue − (maint. + fuel)) ÷ acquisition cost</div></div>
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Monthly revenue</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 150, padding: '6px 4px 0' }}>
            {revenue.map((r, i) => {
              const isLast = i === revenue.length - 1;
              return (
                <div key={r.month} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: `${(r.value / maxRevenue) * 100}%`,
                    background: isLast ? '#14243c' : 'var(--raised)',
                    borderTop: '3px solid var(--amber)', borderRadius: '5px 5px 0 0',
                  }} />
                  <div className="num" style={{ fontSize: 11, color: isLast ? 'var(--amber)' : 'var(--faint)', marginTop: 6 }}>{r.month}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <h3>Top costliest vehicles</h3>
          {topCostly.list.map(({ vehicle, total }) => (
            <div className="hbar" key={vehicle.id}>
              <span className="num">{vehicle.name}</span>
              <div className="tr"><i style={{ width: `${(total / topCostly.max) * 100}%`, background: total > topCostly.max * 0.7 ? 'var(--red)' : total > topCostly.max * 0.3 ? 'var(--orange)' : 'var(--amber)' }} /></div>
              <span className="num">₹{total.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
