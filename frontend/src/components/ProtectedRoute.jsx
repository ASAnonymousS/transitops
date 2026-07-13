import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ moduleKey, children }) {
  const { user, can } = useApp();
  if (!user) return <Navigate to="/" replace />;
  if (moduleKey && !can(moduleKey)) {
    return (
      <div className="app">
        <div className="main" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
          <div className="card" style={{ maxWidth: 420, textAlign: 'center' }}>
            <h2 className="disp" style={{ marginBottom: 8 }}>🔒 Access restricted</h2>
            <p style={{ color: 'var(--dim)', fontSize: 13 }}>
              Your role ({user.role}) doesn't have permission to view this module.
              See Settings → Role-based access for the full matrix.
            </p>
          </div>
        </div>
      </div>
    );
  }
  return children;
}
