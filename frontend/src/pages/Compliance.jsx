import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Shell from '../components/Shell';
import Chip, { Plate } from '../components/Chip';

const TODAY = new Date('2026-07-12');
const DAY_MS = 1000 * 60 * 60 * 24;

export default function Compliance() {
  const { drivers, isLicenseExpired, setDriverStatus, canEdit, pushToast } = useApp();
  const editable = canEdit('compliance');

  const withDaysLeft = useMemo(() => drivers.map((d) => ({
    ...d,
    daysLeft: Math.round((new Date(d.expiry) - TODAY) / DAY_MS),
  })).sort((a, b) => a.daysLeft - b.daysLeft), [drivers]);

  const expired = withDaysLeft.filter((d) => d.daysLeft < 0).length;
  const expiringSoon = withDaysLeft.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 60).length;
  const suspended = drivers.filter((d) => d.status === 'Suspended').length;
  const avgSafety = drivers.length ? Math.round(drivers.reduce((s, d) => s + d.safety, 0) / drivers.length) : 0;

  const toggleSuspend = (d) => {
    if (d.status === 'Suspended') {
      setDriverStatus(d.id, 'Available');
      pushToast(`${d.name} reinstated and marked Available.`);
    } else {
      setDriverStatus(d.id, 'Suspended');
      pushToast(`${d.name} suspended. Blocked from trip assignment.`, 'warn');
    }
  };

  return (
    <Shell title="Driver compliance">
      <div className="grid kpis" style={{ marginBottom: 14 }}>
        <div className="card kpi"><div className="n" style={{ color: expired ? 'var(--red)' : undefined }}>{String(expired).padStart(2, '0')}</div><div className="l">Expired licenses</div></div>
        <div className="card kpi"><div className="n" style={{ color: expiringSoon ? 'var(--orange)' : undefined }}>{String(expiringSoon).padStart(2, '0')}</div><div className="l">Expiring within 60 days</div></div>
        <div className="card kpi"><div className="n" style={{ color: suspended ? 'var(--red)' : undefined }}>{String(suspended).padStart(2, '0')}</div><div className="l">Suspended drivers</div></div>
        <div className="card kpi"><div className="n">{avgSafety}</div><div className="l">Avg. safety score</div>
          <div className="bar"><i style={{ width: `${avgSafety}%` }} /></div></div>
      </div>

      {expired > 0 && (
        <div className="alert err" style={{ marginBottom: 14 }}>
          {expired} driver{expired > 1 ? 's have' : ' has'} an expired license and {expired > 1 ? 'are' : 'is'} automatically blocked from trip assignment.
        </div>
      )}

      <div className="card">
        <h3>License &amp; safety compliance</h3>
        <div className="tablewrap">
          <table>
            <thead>
              <tr><th>Driver</th><th>License no.</th><th>Expiry</th><th>Days left</th><th>Safety score</th><th>Status</th>{editable && <th></th>}</tr>
            </thead>
            <tbody>
              {withDaysLeft.map((d) => {
                const expiredNow = isLicenseExpired(d);
                return (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td>
                    <td><Plate dl>{d.license}</Plate></td>
                    <td className="num">{new Date(d.expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="num" style={{ color: d.daysLeft < 0 ? 'var(--red)' : d.daysLeft <= 60 ? 'var(--orange)' : 'var(--dim)' }}>
                      {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)} overdue` : `${d.daysLeft} days`}
                    </td>
                    <td>
                      <div className="hbar" style={{ gridTemplateColumns: '1fr 38px', margin: 0 }}>
                        <div className="tr"><i style={{ width: `${d.safety}%`, background: d.safety >= 90 ? 'var(--green)' : d.safety >= 80 ? 'var(--orange)' : 'var(--red)' }} /></div>
                        <span className="num">{d.safety}</span>
                      </div>
                    </td>
                    <td>{expiredNow && d.status !== 'Suspended' ? <Chip status="Expired" label="Blocked · expired" /> : <Chip status={d.status} />}</td>
                    {editable && (
                      <td>
                        <button className="linkbtn" onClick={() => toggleSuspend(d)} disabled={expiredNow && d.status !== 'Suspended'}>
                          {d.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
