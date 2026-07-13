// Mock seed data for TransitOps.
// In a real deployment this would come from the backend API; for the hackathon
// frontend it lives in memory (seeded once) so every business rule below can be
// demonstrated end-to-end without a server.

export const USERS = [
  { email: 'raven.k@transitops.in', password: 'password', name: 'Raven K.', role: 'Dispatcher' },
  { email: 'meera.f@transitops.in', password: 'password', name: 'Meera F.', role: 'Fleet Manager' },
  { email: 'sam.s@transitops.in', password: 'password', name: 'Sam S.', role: 'Safety Officer' },
  { email: 'nikhil.a@transitops.in', password: 'password', name: 'Nikhil A.', role: 'Financial Analyst' },
];

// Role-based access matrix.
// Each role only sees/uses the modules explicitly assigned to it, plus Settings
// which is visible to every role. 'edit' = full CRUD, false = not visible at all
// (no lock icon — the nav item is simply absent, and the route is blocked too).
export const RBAC = {
  'Fleet Manager':     { dashboard: false, fleet: 'edit', drivers: false,  trips: false,  maintenance: 'edit', compliance: false, fuel: false,  analytics: false, settings: 'edit' },
  'Dispatcher':        { dashboard: 'edit', fleet: false, drivers: false,  trips: 'edit', maintenance: false,  compliance: false, fuel: false,  analytics: false, settings: 'edit' },
  'Safety Officer':    { dashboard: false, fleet: false,  drivers: 'edit', trips: false,  maintenance: false,  compliance: 'edit', fuel: false,  analytics: false, settings: 'edit' },
  'Financial Analyst': { dashboard: false, fleet: false,  drivers: false,  trips: false,  maintenance: false,  compliance: false, fuel: 'edit', analytics: 'edit', settings: 'edit' },
};

// First page each role lands on after login.
export const ROLE_HOME = {
  'Fleet Manager': '/fleet',
  'Dispatcher': '/dashboard',
  'Safety Officer': '/drivers',
  'Financial Analyst': '/fuel',
};

export const VEHICLE_TYPES = ['Van', 'Truck', 'Mini', 'Bus'];
export const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
export const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];


export const initialVehicles = [
  { id: 'V001', reg: 'GJ01 AB 4521', name: 'VAN-05', type: 'Van', maxLoad: 500, odometer: 74000, acqCost: 620000, status: 'Available', region: 'Gandhinagar' },
  { id: 'V002', reg: 'GJ01 AB 9981', name: 'TRUCK-11', type: 'Truck', maxLoad: 5000, odometer: 182000, acqCost: 2450000, status: 'On Trip', region: 'Ahmedabad' },
  { id: 'V003', reg: 'GJ01 AB 1120', name: 'MINI-03', type: 'Mini', maxLoad: 1000, odometer: 66000, acqCost: 410000, status: 'In Shop', region: 'Gandhinagar' },
  { id: 'V004', reg: 'GJ01 AB 0087', name: 'VAN-09', type: 'Van', maxLoad: 750, odometer: 241900, acqCost: 590000, status: 'Retired', region: 'Sanand' },
  { id: 'V005', reg: 'GJ01 AB 3310', name: 'TRUCK-04', type: 'Truck', maxLoad: 4500, odometer: 98000, acqCost: 2200000, status: 'On Trip', region: 'Ahmedabad' },
  { id: 'V006', reg: 'GJ01 AB 7712', name: 'BUS-02', type: 'Bus', maxLoad: 2000, odometer: 55000, acqCost: 1800000, status: 'Available', region: 'Kalol' },
];

export const initialDrivers = [
  { id: 'D001', name: 'Alex', license: 'DL-88213', category: 'LMV', expiry: '2028-12-01', contact: '9876543210', safety: 96, tripCompletion: 96, status: 'Available' },
  { id: 'D002', name: 'John', license: 'DL-44120', category: 'HMV', expiry: '2025-03-01', contact: '9822012345', safety: 81, tripCompletion: 81, status: 'Suspended' },
  { id: 'D003', name: 'Priya', license: 'DL-77031', category: 'LMV', expiry: '2027-08-01', contact: '9911098765', safety: 99, tripCompletion: 99, status: 'On Trip' },
  { id: 'D004', name: 'Suresh', license: 'DL-90045', category: 'HMV', expiry: '2027-01-01', contact: '9744098765', safety: 88, tripCompletion: 88, status: 'On Trip' },
  { id: 'D005', name: 'Nita', license: 'DL-51290', category: 'LMV', expiry: '2029-05-01', contact: '9900112233', safety: 92, tripCompletion: 90, status: 'Off Duty' },
];

export const initialTrips = [
  { id: 'TR001', source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub', vehicleId: 'V002', driverId: 'D003', cargoWeight: 4200, distance: 45, status: 'Dispatched', eta: '45 min', finalOdometer: null, fuelConsumed: null },
  { id: 'TR002', source: 'Vatva Industrial Area', destination: 'Sanand Warehouse', vehicleId: 'V005', driverId: 'D004', cargoWeight: 3800, distance: 38, status: 'Dispatched', eta: '1h 10m', finalOdometer: null, fuelConsumed: null },
  { id: 'TR003', source: 'Kalol Depot', destination: 'Mansa', vehicleId: null, driverId: null, cargoWeight: 300, distance: 22, status: 'Completed', eta: '—', finalOdometer: 66300, fuelConsumed: 12 },
  { id: 'TR004', source: 'Mansa', destination: 'Kalol Depot', vehicleId: null, driverId: null, cargoWeight: 0, distance: 22, status: 'Cancelled', eta: '—', finalOdometer: null, fuelConsumed: null },
];

export const initialMaintenance = [
  { id: 'M001', vehicleId: 'V003', serviceType: 'Tyre replace', cost: 6200, date: '2026-07-04', status: 'Active' },
  { id: 'M002', vehicleId: 'V002', serviceType: 'Engine repair', cost: 18000, date: '2026-06-20', status: 'Closed' },
];

export const initialFuelLogs = [
  { id: 'F001', vehicleId: 'V001', date: '2026-07-05', liters: 42, cost: 3150, tripId: null },
  { id: 'F002', vehicleId: 'V002', date: '2026-07-06', liters: 110, cost: 8400, tripId: 'TR001' },
  { id: 'F003', vehicleId: 'V005', date: '2026-07-06', liters: 28, cost: 2050, tripId: 'TR002' },
];

export const initialExpenses = [
  { id: 'E001', vehicleId: 'V001', tripId: 'TR003', toll: 120, other: 0, date: '2026-07-05' },
  { id: 'E002', vehicleId: 'V002', tripId: 'TR001', toll: 340, other: 150, date: '2026-07-06' },
];

// Monthly revenue used purely for the Analytics revenue chart / ROI calc.
export const initialRevenue = [
  { month: 'MAR', value: 420000 },
  { month: 'APR', value: 540000 },
  { month: 'MAY', value: 375000 },
  { month: 'JUN', value: 640000 },
  { month: 'JUL', value: 480000 },
];

export const initialVehicleRevenue = {
  V001: 45000, V002: 210000, V003: 62000, V004: 0, V005: 180000, V006: 90000,
};
