import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { USERS, RBAC, initialRevenue, initialVehicleRevenue } from '../data/mockData';
import api from '../utils/api';

const AppContext = createContext(null);

const SESSION_KEY = 'to_session';

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      return saved?.role ? saved : null;
    } catch {
      return null;
    }
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  // Kept static from mock data as there is no backend table for historical revenue graph yet
  const [revenue] = useState(initialRevenue);
  const [vehicleRevenue] = useState(initialVehicleRevenue);

  const [toasts, setToasts] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const pushToast = useCallback((message, kind = 'ok') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  // ---------------- DATA FETCHING ----------------

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
      const [v, d, t, m, f, e] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/trips'),
        api.get('/maintenance'),
        api.get('/fuel'),
        api.get('/expenses'),
      ]);
      setVehicles(v.data);
      setDrivers(d.data);
      setTrips(t.data);
      setMaintenance(m.data);
      setFuelLogs(f.data);
      setExpenses(e.data);
      setIsDataLoaded(true);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      pushToast("Error fetching database records.", "warn");
    }
  }, [user, pushToast]);

  useEffect(() => {
    if (user) fetchAllData();
    else setIsDataLoaded(false);
  }, [user, fetchAllData]);

  // ---------------- AUTH ----------------

  const login = useCallback(async (email, password, role, remember = false) => {
    try {
      const body = new URLSearchParams();
      body.append('username', email.trim());
      body.append('password', password);
      const { data } = await api.post('/auth/login', body);

      localStorage.setItem('token', data.access_token);
      const fetchedUser = data.user;
      if (role && fetchedUser.role !== role) {
        return { ok: false, error: `That account is registered as ${fetchedUser.role}, not ${role}.` };
      }
      const store = remember ? localStorage : sessionStorage;
      (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
      store.setItem(SESSION_KEY, JSON.stringify(fetchedUser));
      setUser(fetchedUser);
      return { ok: true, user: fetchedUser };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.detail
          || 'Cannot reach the server. Is the backend running on port 8000?',
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const perms = user ? RBAC[user.role] : null;
  const can = useCallback((module) => {
    if (!perms) return false;
    return perms[module] === 'edit' || perms[module] === 'view';
  }, [perms]);
  const canEdit = useCallback((module) => perms?.[module] === 'edit', [perms]);

  // ---------------- DERIVED / HELPERS ----------------
  const today = new Date('2026-07-12');
  const isLicenseExpired = useCallback((driver) => new Date(driver.expiry) < today, []);

  const dispatchableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'Available'),
    [vehicles]
  );

  const eligibleDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'Available' && !isLicenseExpired(d)),
    [drivers, isLicenseExpired]
  );

  const vehicleById = useCallback((id) => vehicles.find((v) => String(v.id) === String(id)), [vehicles]);
  const driverById = useCallback((id) => drivers.find((d) => String(d.id) === String(id)), [drivers]);

  const costByVehicle = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => { map[v.id] = { fuel: 0, maintenance: 0, tolls: 0, other: 0 }; });
    fuelLogs.forEach((f) => { if (map[f.vehicleId]) map[f.vehicleId].fuel += f.cost; });
    maintenance.forEach((m) => { if (map[m.vehicleId]) map[m.vehicleId].maintenance += m.cost; });
    expenses.forEach((e) => {
      if (map[e.vehicleId]) { map[e.vehicleId].tolls += e.toll; map[e.vehicleId].other += e.other; }
    });
    return map;
  }, [vehicles, fuelLogs, maintenance, expenses]);

  const totalOperationalCost = useMemo(
    () => Object.values(costByVehicle).reduce((s, c) => s + c.fuel + c.maintenance, 0),
    [costByVehicle]
  );

  const fleetUtilization = useMemo(() => {
    const active = vehicles.filter((v) => v.status !== 'Retired');
    if (active.length === 0) return 0;
    const onTrip = active.filter((v) => v.status === 'On Trip').length;
    return Math.round((onTrip / active.length) * 100);
  }, [vehicles]);

  const totalDistance = useMemo(
    () => trips.filter((t) => t.status === 'Completed').reduce((s, t) => s + (t.actualDistance || t.distance || 0), 0),
    [trips]
  );
  const totalFuel = useMemo(() => fuelLogs.reduce((s, f) => s + f.liters, 0), [fuelLogs]);
  const fuelEfficiency = totalFuel > 0 ? +(totalDistance / totalFuel).toFixed(1) : 0;

  const vehicleROI = useCallback((vehicleId) => {
    const v = vehicleById(vehicleId);
    if (!v || !v.acqCost) return 0;
    const rev = vehicleRevenue[vehicleId] || 0;
    const cost = costByVehicle[vehicleId] || { fuel: 0, maintenance: 0 };
    return +(((rev - (cost.maintenance + cost.fuel)) / v.acqCost) * 100).toFixed(1);
  }, [vehicleById, vehicleRevenue, costByVehicle]);

  const overallROI = useMemo(() => {
    const totalAcq = vehicles.reduce((s, v) => s + v.acqCost, 0);
    const totalRev = Object.values(vehicleRevenue).reduce((s, r) => s + r, 0);
    if (!totalAcq) return 0;
    return +(((totalRev - totalOperationalCost) / totalAcq) * 100).toFixed(1);
  }, [vehicles, vehicleRevenue, totalOperationalCost]);

  // ---------------- VEHICLES ----------------
  const addVehicle = useCallback(async (data) => {
    try {
      const res = await api.post('/vehicles', {
        registration_number: data.reg,
        model: data.name,
        type: data.type,
        max_capacity: Number(data.maxLoad),
        acquisition_cost: Number(data.acqCost),
        odometer: Number(data.odometer) || 0,
        region: data.region,
        status: data.status,
      });
      setVehicles((v) => [...v, res.data]);
      pushToast(`Vehicle ${res.data.name} (${res.data.reg}) registered.`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to register vehicle.' };
    }
  }, [pushToast]);

  const updateVehicle = useCallback(async (id, data) => {
    try {
      const res = await api.put(`/vehicles/${id}`, {
        registration_number: data.reg,
        model: data.name,
        type: data.type,
        max_capacity: Number(data.maxLoad),
        acquisition_cost: Number(data.acqCost),
        odometer: Number(data.odometer) || 0,
        region: data.region,
        status: data.status,
      });
      setVehicles((vs) => vs.map((v) => (v.id === id ? res.data : v)));
      pushToast('Vehicle updated.');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to update vehicle.' };
    }
  }, [pushToast]);

  // ---------------- DRIVERS ----------------
  const addDriver = useCallback(async (data) => {
    try {
      const res = await api.post('/drivers', {
        name: data.name,
        license_number: data.license,
        license_category: data.category,
        license_expiry: data.expiry,
        contact_number: data.contact,
      });
      setDrivers((d) => [...d, res.data]);
      pushToast(`Driver ${res.data.name} added.`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to add driver.' };
    }
  }, [pushToast]);

  const updateDriver = useCallback(async (id, data) => {
    try {
      const res = await api.put(`/drivers/${id}`, {
        name: data.name,
        license_number: data.license,
        license_category: data.category,
        license_expiry: data.expiry,
        contact_number: data.contact,
      });
      setDrivers((ds) => ds.map((d) => (d.id === id ? res.data : d)));
      pushToast('Driver updated.');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to update driver.' };
    }
  }, [pushToast]);

  const setDriverStatus = useCallback(async (id, status) => {
    try {
      const res = await api.put(`/drivers/${id}/status`, { status });
      setDrivers((ds) => ds.map((d) => (d.id === id ? res.data : d)));
    } catch (err) {
      pushToast('Failed to update driver status', 'warn');
    }
  }, [pushToast]);

  // ---------------- TRIPS ----------------
  const validateTrip = useCallback((vehicleId, driverId, cargoWeight) => {
    const vehicle = vehicleById(vehicleId);
    const driver = driverById(driverId);
    if (!vehicle) return { ok: false, error: 'Select a vehicle.' };
    if (!driver) return { ok: false, error: 'Select a driver.' };
    if (vehicle.status !== 'Available') return { ok: false, error: `${vehicle.name} is currently ${vehicle.status} and cannot be dispatched.` };
    if (driver.status !== 'Available') return { ok: false, error: `${driver.name} is currently ${driver.status} and cannot be assigned.` };
    if (isLicenseExpired(driver)) return { ok: false, error: `${driver.name}'s license expired on ${driver.expiry}.` };
    const weight = Number(cargoWeight) || 0;
    if (weight > vehicle.maxLoad) {
      return { ok: false, error: `Capacity exceeded by ${weight - vehicle.maxLoad} kg — cargo ${weight} kg > ${vehicle.name} limit ${vehicle.maxLoad} kg. Dispatch blocked.` };
    }
    if (weight <= 0) return { ok: false, error: 'Enter a cargo weight greater than 0.' };
    return { ok: true, message: `${weight} kg ≤ ${vehicle.maxLoad} kg capacity — ready to dispatch.` };
  }, [vehicleById, driverById, isLicenseExpired]);

  const createTrip = useCallback(async (data, dispatchNow) => {
    if (dispatchNow) {
      const check = validateTrip(data.vehicleId, data.driverId, data.cargoWeight);
      if (!check.ok) return check;
      try {
        const res = await api.post('/trips/dispatch', {
          source: data.source,
          destination: data.destination,
          vehicle_id: data.vehicleId,
          driver_id: data.driverId,
          cargo_weight: Number(data.cargoWeight) || 0,
          planned_distance: Number(data.distance) || 0,
        });
        const savedTrip = res.data.data;
        setTrips((t) => [savedTrip, ...t]);
        setVehicles((vs) => vs.map((v) => (v.id === savedTrip.vehicleId ? { ...v, status: 'On Trip' } : v)));
        setDrivers((ds) => ds.map((d) => (d.id === savedTrip.driverId ? { ...d, status: 'On Trip' } : d)));
        pushToast(`Trip ${savedTrip.id} dispatched.`);
        return { ok: true, trip: savedTrip };
      } catch (err) {
        return { ok: false, error: err.response?.data?.detail || 'Failed to dispatch trip.' };
      }
    } else {
      // Create local Draft
      const trip = {
        id: `DRAFT-${Date.now()}`,
        backendId: null,
        source: data.source, destination: data.destination,
        vehicleId: data.vehicleId || null, driverId: data.driverId || null,
        cargoWeight: Number(data.cargoWeight) || 0, distance: Number(data.distance) || 0,
        status: 'Draft', eta: 'awaiting dispatch',
        finalOdometer: null, fuelConsumed: null,
      };
      setTrips((t) => [trip, ...t]);
      pushToast(`Trip saved as draft.`);
      return { ok: true, trip };
    }
  }, [validateTrip, pushToast]);

  const dispatchTrip = useCallback(async (tripId, vehicleId, driverId) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip || trip.status !== 'Draft') return { ok: false, error: 'Only draft trips can be dispatched.' };
    const check = validateTrip(vehicleId, driverId, trip.cargoWeight);
    if (!check.ok) return check;
    try {
      const res = await api.post('/trips/dispatch', {
        source: trip.source,
        destination: trip.destination,
        vehicle_id: vehicleId,
        driver_id: driverId,
        cargo_weight: trip.cargoWeight,
        planned_distance: trip.distance,
      });
      const savedTrip = res.data.data;
      setTrips((ts) => ts.map((t) => (t.id === tripId ? savedTrip : t)));
      setVehicles((vs) => vs.map((v) => (v.id === vehicleId ? { ...v, status: 'On Trip' } : v)));
      setDrivers((ds) => ds.map((d) => (d.id === driverId ? { ...d, status: 'On Trip' } : d)));
      pushToast(`Trip dispatched successfully.`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to dispatch trip.' };
    }
  }, [trips, validateTrip, pushToast]);

  const completeTrip = useCallback(async (tripId, finalOdometer, fuelConsumed, fuelCost) => {
    try {
      const res = await api.post(`/trips/${tripId}/complete`, {
        final_odometer: Number(finalOdometer) || null,
        fuel_consumed: Number(fuelConsumed) || null,
        fuel_cost: Number(fuelCost) || null,
      });
      const updatedTrip = res.data.trip;
      setTrips((ts) => ts.map((t) => (t.id === tripId ? updatedTrip : t)));
      setVehicles((vs) => vs.map((v) => (v.id === updatedTrip.vehicleId ? { ...v, status: 'Available', odometer: Math.max(v.odometer, Number(finalOdometer) || v.odometer) } : v)));
      setDrivers((ds) => ds.map((d) => (d.id === updatedTrip.driverId ? { ...d, status: 'Available' } : d)));
      
      if (Number(fuelConsumed) > 0) {
        // Fetch fuel logs again since the backend auto-created one
        const f = await api.get('/fuel');
        setFuelLogs(f.data);
      }
      pushToast(`Trip ${tripId} completed. Assets returned to Available.`);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to complete trip.' };
    }
  }, [pushToast]);

  const cancelTrip = useCallback(async (tripId) => {
    try {
      // Local drafts might not have a backend representation yet.
      if (String(tripId).startsWith('DRAFT')) {
        setTrips((ts) => ts.map((t) => (t.id === tripId ? { ...t, status: 'Cancelled' } : t)));
        pushToast('Draft trip cancelled.');
        return { ok: true };
      }
      const res = await api.post(`/trips/${tripId}/cancel`);
      const updatedTrip = res.data.trip;
      setTrips((ts) => ts.map((t) => (t.id === tripId ? updatedTrip : t)));
      if (updatedTrip.status === 'Cancelled') {
        setVehicles((vs) => vs.map((v) => (v.id === updatedTrip.vehicleId ? { ...v, status: 'Available' } : v)));
        setDrivers((ds) => ds.map((d) => (d.id === updatedTrip.driverId ? { ...d, status: 'Available' } : d)));
      }
      pushToast(`Trip ${tripId} cancelled.`, 'warn');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.detail || 'Failed to cancel trip.' };
    }
  }, [pushToast]);

  // ---------------- MAINTENANCE ----------------
  const addMaintenance = useCallback(async (data) => {
    try {
      const res = await api.post('/maintenance', {
        vehicle_id: data.vehicleId,
        description: data.serviceType,
        cost: Number(data.cost),
        status: data.status,
        start_date: data.date,
      });
      setMaintenance((m) => [res.data, ...m]);
      if (res.data.status === 'Active') {
        setVehicles((vs) => vs.map((v) => (v.id === res.data.vehicleId ? { ...v, status: 'In Shop' } : v)));
        pushToast(`Service logged. Vehicle moved to In Shop.`, 'warn');
      } else {
        pushToast('Service record logged.');
      }
      return { ok: true };
    } catch (err) {
      pushToast('Failed to add maintenance record', 'err');
      return { ok: false };
    }
  }, [pushToast]);

  const closeMaintenance = useCallback(async (id) => {
    try {
      const res = await api.put(`/maintenance/${id}/close`);
      const updatedRecord = res.data;
      setMaintenance((ms) => ms.map((m) => (m.id === id ? updatedRecord : m)));
      setVehicles((vs) => vs.map((v) => {
        if (v.id !== updatedRecord.vehicleId) return v;
        if (v.status === 'Retired') return v;
        return { ...v, status: 'Available' };
      }));
      pushToast('Maintenance closed. Vehicle restored to Available.');
    } catch (err) {
      pushToast('Failed to close maintenance.', 'err');
    }
  }, [pushToast]);

  // ---------------- FUEL & EXPENSES ----------------
  const addFuelLog = useCallback(async (data) => {
    try {
      const parsedTripId = data.tripId ? Number(data.tripId) : null;
      const res = await api.post('/fuel', {
        vehicle_id: data.vehicleId,
        trip_id: isNaN(parsedTripId) ? null : parsedTripId,
        liters: Number(data.liters),
        cost: Number(data.cost),
        log_date: data.date,
      });
      setFuelLogs((fl) => [res.data, ...fl]);
      pushToast('Fuel log added.');
    } catch (err) {
      pushToast('Failed to add fuel log.', 'err');
    }
  }, [pushToast]);

  const addExpense = useCallback(async (data) => {
    try {
      const isToll = Boolean(data.toll);
      const isOther = Boolean(data.other);
      
      const calls = [];
      const parsedTripId = data.tripId ? Number(data.tripId) : null;
      if (isToll) {
        calls.push(api.post('/expenses', {
          vehicle_id: data.vehicleId,
          trip_id: isNaN(parsedTripId) ? null : parsedTripId,
          category: 'Toll',
          amount: Number(data.toll),
          log_date: data.date,
        }));
      }
      if (isOther) {
        calls.push(api.post('/expenses', {
          vehicle_id: data.vehicleId,
          trip_id: isNaN(parsedTripId) ? null : parsedTripId,
          category: 'Other',
          amount: Number(data.other),
          log_date: data.date,
        }));
      }
      const responses = await Promise.all(calls);
      setExpenses((ex) => [...responses.map(r => r.data), ...ex]);
      pushToast('Expense added.');
    } catch (err) {
      pushToast('Failed to add expense.', 'err');
    }
  }, [pushToast]);

  const value = {
    user, login, logout, perms, can, canEdit,
    vehicles, drivers, trips, maintenance, fuelLogs, expenses, revenue,
    dispatchableVehicles, eligibleDrivers, vehicleById, driverById, isLicenseExpired,
    costByVehicle, totalOperationalCost, fleetUtilization, fuelEfficiency, vehicleROI, overallROI,
    addVehicle, updateVehicle, addDriver, updateDriver, setDriverStatus,
    validateTrip, createTrip, dispatchTrip, completeTrip, cancelTrip,
    addMaintenance, closeMaintenance, addFuelLog, addExpense,
    toasts, pushToast, isDataLoaded
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
