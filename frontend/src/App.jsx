import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import Toasts from './components/Toasts';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Drivers from './pages/Drivers';
import Compliance from './pages/Compliance';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute moduleKey="dashboard"><Dashboard /></ProtectedRoute>} />
          <Route path="/fleet" element={<ProtectedRoute moduleKey="fleet"><Fleet /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute moduleKey="drivers"><Drivers /></ProtectedRoute>} />
          <Route path="/compliance" element={<ProtectedRoute moduleKey="compliance"><Compliance /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute moduleKey="trips"><Trips /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute moduleKey="maintenance"><Maintenance /></ProtectedRoute>} />
          <Route path="/fuel" element={<ProtectedRoute moduleKey="fuel"><FuelExpenses /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute moduleKey="analytics"><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute moduleKey="settings"><Settings /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
      <Toasts />
    </AppProvider>
  );
}
