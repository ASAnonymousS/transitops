import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Route, Truck, Users, ShieldCheck,
  Wrench, Fuel, BarChart3, Settings as SettingsIcon, Menu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', key: 'dashboard', Icon: LayoutDashboard },
  { to: '/trips', label: 'Trips', key: 'trips', Icon: Route },
  { to: '/fleet', label: 'Fleet', key: 'fleet', Icon: Truck },
  { to: '/drivers', label: 'Drivers', key: 'drivers', Icon: Users },
  { to: '/compliance', label: 'Compliance', key: 'compliance', Icon: ShieldCheck },
  { to: '/maintenance', label: 'Maintenance', key: 'maintenance', Icon: Wrench },
  { to: '/fuel', label: 'Fuel & Expenses', key: 'fuel', Icon: Fuel },
  { to: '/analytics', label: 'Analytics', key: 'analytics', Icon: BarChart3 },
  { to: '/settings', label: 'Settings', key: 'settings', Icon: SettingsIcon },
];

function Logo() {
  return (
    <div className="brand">
      <svg width="28" height="28" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="56" cy="55" r="30" fill="none" stroke="#3f7fdd" strokeWidth="11"
          strokeLinecap="round" strokeDasharray="148 41" transform="rotate(-215 56 55)" />
        <path d="M14 10 L72 10 L65 26 L46 26 L32 92 L12 92 L26 26 L8 26 Z" fill="#eef2f7" />
        <path d="M40 26 L46 26 L30 92 L18 92 Z" fill="#101720" />
        <path d="M42 30 L27 88" stroke="#eef2f7" strokeWidth="2.6" strokeDasharray="7 6" fill="none" />
      </svg>
      <b>TRANSIT<span className="ops">OPS</span></b>
    </div>
  );
}

function NavList({ onNavigate }) {
  const { can } = useApp();
  return (
    <nav className="nav">
      {NAV_ITEMS.map((item) => {
        if (!can(item.key)) return null;
        const { Icon } = item;
        return (
          <NavLink key={item.key} to={item.to} onClick={onNavigate}
            className={({ isActive }) => (isActive ? 'act' : '')}>
            <Icon size={16} strokeWidth={2} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

function WhoAmI() {
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!user) return null;
  const displayName = user.name || user.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="who" onClick={() => setOpen((o) => !o)}>
      <div className="av">{initials}</div>
      <div>
        <div className="nm">{displayName}</div>
        <div className="rl">{user.role}</div>
      </div>
      {open && (
        <div className="logout-menu" onMouseLeave={() => setOpen(false)}>
          <button onClick={() => { logout(); navigate('/'); }}>Sign out</button>
        </div>
      )}
    </div>
  );
}

export default function Shell({ title, actions, search, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="mobilebar">
        <button className="btn ghost sm" onClick={() => setMobileOpen((o) => !o)}><Menu size={16} /></button>
        <b>TRANSIT<span style={{ color: 'var(--amber)' }}>OPS</span></b>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="mobile-nav"
            onClick={() => setMobileOpen(false)}
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Logo />
            <NavList onNavigate={() => setMobileOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="app">
        <aside className="side">
          <Logo />
          <NavList />
          <div className="sidefoot">
            <div className="ver"></div>
            <div>© 2026 TransitOps</div>
          </div>
        </aside>
        <motion.div
          className="main"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          <div className="top">
            <h1>{title}</h1>
            <div className="sp" />
            {search}
            {actions}
            <WhoAmI />
          </div>
          {children}
        </motion.div>
      </div>
    </>
  );
}
