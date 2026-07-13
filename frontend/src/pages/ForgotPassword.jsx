import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Dispatcher');
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
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
            Account recovery, <span style={{ color: '#4d8fe8' }}>handled by your admin.</span>
          </h2>
          <p style={{ color: 'var(--dim)', fontSize: 14.5, marginTop: 10, lineHeight: 1.65 }}>
            Password resets are managed centrally for security. Submit your details and the
            administrator will verify your identity and set up new credentials for you.
          </p>
        </div>
        <div className="foot">TransitOps © 2026 · Role-based access</div>
      </div>
      <div className="r">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {sent ? (
            <>
              <h2 className="disp">Request sent</h2>
              <p>Your password reset request has been recorded.</p>
              <div className="alert ok" style={{ marginTop: 4, marginBottom: 18 }}>
                ✓ The admin has been informed and will contact you at{' '}
                <b>{email}</b> shortly to reset your credentials.
              </div>
              <Link to="/" className="btn pri" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h2 className="disp">Forgot password</h2>
              <p>Tell us who you are — the admin will get in touch</p>
              <form onSubmit={onSubmit}>
                <div className="fld">
                  <label>Full name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Raven K." required />
                </div>
                <div className="fld">
                  <label>Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@transitops.in" required />
                </div>
                <div className="fld">
                  <label>Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option>Dispatcher</option>
                    <option>Fleet Manager</option>
                    <option>Safety Officer</option>
                    <option>Financial Analyst</option>
                  </select>
                </div>
                <button className="btn pri" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} type="submit">
                  Submit request
                </button>
              </form>
              <p className="note" style={{ textAlign: 'center' }}>
                Remembered it? <Link to="/" style={{ color: 'var(--amber)', textDecoration: 'none' }}>Back to sign in</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
