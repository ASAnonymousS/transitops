import { motion } from 'framer-motion';

export default function Modal({ title, subtitle, onClose, children, width }) {
  return (
    <motion.div
      className="overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="modal"
        style={width ? { maxWidth: width } : undefined}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>{title}</h2>
            {subtitle && <p style={{ color: 'var(--dim)', fontSize: 12.5, marginTop: 4 }}>{subtitle}</p>}
          </div>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ marginTop: 18 }}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
