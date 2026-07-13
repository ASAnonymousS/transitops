import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ROLE_HOME } from '../data/mockData';

const remembered = (() => {
  try {
    return JSON.parse(localStorage.getItem('to_remember')) || null;
  } catch {
    return null;
  }
})();

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  
  // Pre-populate utilizing either local storage snapshots or database seeding baselines
  const [email, setEmail] = useState(remembered?.email || 'meera.f@transitops.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState(remembered?.role || 'Fleet Manager');
  const [remember, setRemember] = useState(!!remembered);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (attempts >= 5) {
      setError('Account locked after 5 failed attempts. Please contact your Fleet Manager.');
      return;
    }
    
    // Call the newly implemented asynchronous networking endpoint method
    const res = await login(email, password, role, remember);
    if (!res.ok) {
      setAttempts((a) => a + 1);
      setError(res.error);
      return;
    }
    
    setError('');
    // Route page view segments cleanly according to verified role mapping states
    navigate(ROLE_HOME[res.user.role] || '/settings');
  };

  return (
    <div className="login">
      <div className="l">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '40px 0 18px' }}>
          <svg width="80" height="80" viewBox="0 0 100 100" aria-label="TransitOps logo">
            <circle cx="56" cy="55" r="30" fill="none" stroke="#3f7fdd" strokeWidth="11"
              strokeLinecap="round" strokeDasharray="148 41" transform="rotate(-215 56 55)" />
            <path d="M14 10 L72 10 L65 26 L46 26 L32 92 L12 92 L26 26 L8 26 Z" fill="#eef2f7" />
            <path d="M40 26 L46 26 L30 92 L18 92 Z" fill="#101720" />
            <path d="M42 30 L27 88" stroke="#eef2f7" strokeWidth="2.6" strokeDasharray="7 6" fill="none" />
          </svg>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '.02em', lineHeight: 1 }}>
              TRANSIT<span style={{ color: '#4d8fe8' }}>OPS</span>
            </h1>
            <p style={{ color: 'var(--dim)', font: "600 11.5px 'Inter'", letterSpacing: '.22em', textTransform: 'uppercase', marginTop: 10 }}>
              — Smart Transport Operations Platform —
            </p>
          </div>
        </div>
        <div style={{ marginTop: 'auto', marginBottom: 'auto', paddingTop: 40, maxWidth: 480 }}>
          <h2 className="disp" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
            Smart Transport. <span style={{ color: '#4d8fe8' }}>Seamless Operations.</span>
          </h2>
          <p style={{ color: 'var(--dim)', fontSize: 14.5, marginTop: 10, lineHeight: 1.65 }}>
            Manage fleets, drivers, trips, fuel, maintenance, and analytics — all from one intelligent platform.
          </p>
        </div>
        <div className="foot">TransitOps © 2026 · Role-based access</div>
      </div>
      <div className="r">
        <div className="card">
          <h2 className="disp">Sign in</h2>
          <p>Enter your credentials to continue</p>
          <form onSubmit={onSubmit}>
            <div className="fld">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="fld">
              <label>Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            <div className="fld">
              <label>Role (RBAC)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option>Dispatcher</option>
                <option>Fleet Manager</option>
                <option>Safety Officer</option>
                <option>Financial Analyst</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 16px', fontSize: 12, color: 'var(--dim)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: 'var(--amber)', width: 14, height: 14, cursor: 'pointer' }}
                />
                Remember me
              </label>
              <Link to="/forgot" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <button className="btn pri" style={{ width: '100%', justifyContent: 'center' }} type="submit">Sign In</button>
            {error && <div className="alert err" style={{ marginTop: 14 }}>✕ {error}</div>}
          </form>
          <div className="note">
            Demo Server Accounts (password: <span className="mono">password123</span>):
            <div style={{ marginTop: 6, display: 'grid', gap: 3, fontSize: 11 }} className="mono">
              <div>raven.k@transitops.in - Dispatcher</div>
              <div>meera.f@transitops.in - Fleet Manager</div>
              <div>sam.s@transitops.in - Safety Officer</div>
              <div>nikhil.a@transitops.in - Financial Analyst</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}