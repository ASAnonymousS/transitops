from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.models import User, Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense
from backend.core.security import get_password_hash, verify_password, create_access_token, verify_access_token

router = APIRouter(tags=["TransitOps Core Engine"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ─── AUTH DEPENDENCY ──────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired or is invalid")
    email = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User signature not recognized")
    return user


# ─── INPUT SCHEMAS ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str

class TripCreate(BaseModel):
    source: str
    destination: str
    vehicle_id: int
    driver_id: int
    cargo_weight: float
    planned_distance: float

class TripComplete(BaseModel):
    final_odometer: Optional[float] = None
    fuel_consumed: Optional[float] = None
    fuel_cost: Optional[float] = None

class VehicleCreate(BaseModel):
    registration_number: str
    model: str
    type: str
    max_capacity: float
    odometer: Optional[float] = 0
    acquisition_cost: float
    region: Optional[str] = None
    status: Optional[str] = "Available"

class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = None
    model: Optional[str] = None
    type: Optional[str] = None
    max_capacity: Optional[float] = None
    odometer: Optional[float] = None
    acquisition_cost: Optional[float] = None
    region: Optional[str] = None
    status: Optional[str] = None

class DriverCreate(BaseModel):
    name: str
    license_number: str
    license_category: str
    license_expiry: date
    contact_number: Optional[str] = None
    safety_score: Optional[float] = 100.0
    status: Optional[str] = "Available"

class DriverUpdate(BaseModel):
    name: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[date] = None
    contact_number: Optional[str] = None
    safety_score: Optional[float] = None
    status: Optional[str] = None

class DriverStatusUpdate(BaseModel):
    status: str

class MaintenanceCreate(BaseModel):
    vehicle_id: int
    description: str
    cost: Optional[float] = 0
    status: Optional[str] = "Active"
    start_date: date
    end_date: Optional[date] = None

class FuelLogCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    liters: float
    cost: float
    log_date: date

class ExpenseCreate(BaseModel):
    vehicle_id: int
    trip_id: Optional[int] = None
    category: str
    amount: float
    description: Optional[str] = None
    log_date: date


# ─── HELPERS ──────────────────────────────────────────────────────────────────

def _vehicle_to_dict(v: Vehicle):
    return {
        "id": v.id,
        "reg": v.registration_number,
        "name": v.model,
        "type": v.type,
        "maxLoad": float(v.max_capacity),
        "odometer": float(v.odometer or 0),
        "acqCost": float(v.acquisition_cost),
        "region": v.region or "",
        "status": v.status,
    }

def _driver_to_dict(d: Driver):
    return {
        "id": d.id,
        "name": d.name,
        "license": d.license_number,
        "category": d.license_category,
        "expiry": d.license_expiry.isoformat() if d.license_expiry else None,
        "contact": d.contact_number or "",
        "safety": float(d.safety_score or 100),
        "tripCompletion": float(d.safety_score or 100),
        "status": d.status,
    }

def _trip_to_dict(t: Trip):
    return {
        "id": t.id,
        "vehicleId": t.vehicle_id,
        "driverId": t.driver_id,
        "source": t.source,
        "destination": t.destination,
        "cargoWeight": float(t.cargo_weight),
        "distance": float(t.planned_distance),
        "actualDistance": float(t.actual_distance) if t.actual_distance else None,
        "fuelConsumed": float(t.fuel_consumed) if t.fuel_consumed else None,
        "status": t.status,
        "eta": "in transit" if t.status == "Dispatched" else ("—" if t.status in ("Completed", "Cancelled") else "awaiting dispatch"),
        "finalOdometer": None,
        "backendId": t.id,
    }

def _maintenance_to_dict(m: MaintenanceLog):
    return {
        "id": m.id,
        "vehicleId": m.vehicle_id,
        "serviceType": m.description,
        "cost": float(m.cost or 0),
        "date": m.start_date.isoformat() if m.start_date else None,
        "status": m.status,
    }

def _fuel_to_dict(f: FuelLog):
    return {
        "id": f.id,
        "vehicleId": f.vehicle_id,
        "tripId": f.trip_id,
        "liters": float(f.liters),
        "cost": float(f.cost),
        "date": f.log_date.isoformat() if f.log_date else None,
    }

def _expense_to_dict(e: Expense):
    return {
        "id": e.id,
        "vehicleId": e.vehicle_id,
        "tripId": e.trip_id,
        "category": e.category,
        "toll": float(e.amount) if e.category == "Toll" else 0.0,
        "other": float(e.amount) if e.category != "Toll" else 0.0,
        "amount": float(e.amount),
        "description": e.description or "",
        "date": e.log_date.isoformat() if e.log_date else None,
    }


# ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

@router.post("/auth/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="This email is already registered")
    new_user = User(email=user.email, password_hash=get_password_hash(user.password), role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registration successful", "email": new_user.email, "role": new_user.role}


@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user.email, "name": user.email.split("@")[0], "role": user.role},
    }


# ─── VEHICLES ─────────────────────────────────────────────────────────────────

@router.get("/vehicles")
def list_vehicles(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).order_by(Vehicle.id).all()
    return [_vehicle_to_dict(v) for v in vehicles]


@router.post("/vehicles", status_code=201)
def add_vehicle(data: VehicleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Vehicle).filter(Vehicle.registration_number == data.registration_number).first():
        raise HTTPException(status_code=400, detail="Registration number already exists.")
    v = Vehicle(
        registration_number=data.registration_number,
        model=data.model,
        type=data.type,
        max_capacity=data.max_capacity,
        odometer=data.odometer or 0,
        acquisition_cost=data.acquisition_cost,
        region=data.region,
        status=data.status or "Available",
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    return _vehicle_to_dict(v)


@router.put("/vehicles/{vehicle_id}")
def update_vehicle(vehicle_id: int, data: VehicleUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field, value in data.model_dump(exclude_none=True).items():
        # Map frontend camelCase fields to DB column names
        col_map = {
            "registration_number": "registration_number", "model": "model", "type": "type",
            "max_capacity": "max_capacity", "odometer": "odometer",
            "acquisition_cost": "acquisition_cost", "region": "region", "status": "status",
        }
        if field in col_map:
            setattr(v, col_map[field], value)
    db.commit()
    db.refresh(v)
    return _vehicle_to_dict(v)


# ─── DRIVERS ──────────────────────────────────────────────────────────────────

@router.get("/drivers")
def list_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    drivers = db.query(Driver).order_by(Driver.id).all()
    return [_driver_to_dict(d) for d in drivers]


@router.post("/drivers", status_code=201)
def add_driver(data: DriverCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = Driver(
        name=data.name,
        license_number=data.license_number,
        license_category=data.license_category,
        license_expiry=data.license_expiry,
        contact_number=data.contact_number,
        safety_score=data.safety_score or 100,
        status=data.status or "Available",
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return _driver_to_dict(d)


@router.put("/drivers/{driver_id}")
def update_driver(driver_id: int, data: DriverUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(d, field, value)
    db.commit()
    db.refresh(d)
    return _driver_to_dict(d)


@router.put("/drivers/{driver_id}/status")
def update_driver_status(driver_id: int, data: DriverStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    d = db.query(Driver).filter(Driver.id == driver_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    d.status = data.status
    db.commit()
    db.refresh(d)
    return _driver_to_dict(d)


# ─── TRIPS ────────────────────────────────────────────────────────────────────

@router.get("/trips")
def list_trips(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trips = db.query(Trip).order_by(Trip.id.desc()).limit(200).all()
    return [_trip_to_dict(t) for t in trips]


@router.post("/trips/dispatch")
def dispatch_trip(trip: TripCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Fleet Manager", "Dispatcher", "Driver"]:
        raise HTTPException(status_code=403, detail="Your role does not permit trip dispatches")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if not vehicle or not driver:
        raise HTTPException(status_code=404, detail="Vehicle or driver not found")
    if vehicle.status in ["Retired", "In Shop"]:
        raise HTTPException(status_code=400, detail=f"Dispatch Rejected: Vehicle status is '{vehicle.status}'")
    if driver.status == "Suspended":
        raise HTTPException(status_code=400, detail="Dispatch Rejected: Driver is suspended")
    if driver.license_expiry < date.today():
        raise HTTPException(status_code=400, detail="Dispatch Rejected: Driver license is expired")
    if vehicle.status == "On Trip":
        raise HTTPException(status_code=400, detail="Dispatch Rejected: Vehicle is already on a trip")
    if driver.status == "On Trip":
        raise HTTPException(status_code=400, detail="Dispatch Rejected: Driver is already on a trip")
    if trip.cargo_weight > float(vehicle.max_capacity):
        raise HTTPException(status_code=400, detail=f"Dispatch Rejected: Weight ({trip.cargo_weight} kg) exceeds vehicle limit ({vehicle.max_capacity} kg)")

    vehicle.status = "On Trip"
    driver.status = "On Trip"

    new_trip = Trip(
        vehicle_id=vehicle.id,
        driver_id=driver.id,
        source=trip.source,
        destination=trip.destination,
        cargo_weight=trip.cargo_weight,
        planned_distance=trip.planned_distance,
        status="Dispatched",
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return {"status": "Dispatched successfully", "data": _trip_to_dict(new_trip)}


@router.post("/trips/{trip_id}/complete")
def complete_trip(trip_id: int, data: TripComplete = TripComplete(), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
    driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

    if data.final_odometer and vehicle and data.final_odometer > float(vehicle.odometer or 0):
        vehicle.odometer = data.final_odometer
    if vehicle:
        vehicle.status = "Available"
    if driver:
        driver.status = "Available"

    trip.status = "Completed"
    trip.completed_at = datetime.utcnow()
    if data.fuel_consumed is not None:
        trip.fuel_consumed = data.fuel_consumed

    # Auto-create fuel log if provided
    if data.fuel_consumed and data.fuel_consumed > 0:
        fuel_log = FuelLog(
            vehicle_id=trip.vehicle_id,
            trip_id=trip.id,
            liters=data.fuel_consumed,
            cost=data.fuel_cost or 0,
            log_date=date.today(),
        )
        db.add(fuel_log)

    db.commit()
    db.refresh(trip)
    return {"message": "Trip completed. Assets restored to Available.", "trip": _trip_to_dict(trip)}


@router.post("/trips/{trip_id}/cancel")
def cancel_trip(trip_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    if trip.status in ("Completed", "Cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel a {trip.status.lower()} trip")

    was_dispatched = trip.status == "Dispatched"
    trip.status = "Cancelled"
    if was_dispatched:
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()
        if vehicle:
            vehicle.status = "Available"
        if driver:
            driver.status = "Available"

    db.commit()
    return {"message": "Trip cancelled.", "trip": _trip_to_dict(trip)}


# ─── MAINTENANCE ──────────────────────────────────────────────────────────────

@router.get("/maintenance")
def list_maintenance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(MaintenanceLog).order_by(MaintenanceLog.id.desc()).all()
    return [_maintenance_to_dict(m) for m in records]


@router.post("/maintenance", status_code=201)
def add_maintenance(data: MaintenanceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = MaintenanceLog(
        vehicle_id=data.vehicle_id,
        description=data.description,
        cost=data.cost or 0,
        status=data.status or "Active",
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(m)
    # If active, set vehicle to In Shop
    if m.status == "Active":
        vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
        if vehicle:
            vehicle.status = "In Shop"
    db.commit()
    db.refresh(m)
    return _maintenance_to_dict(m)


@router.put("/maintenance/{maintenance_id}/close")
def close_maintenance(maintenance_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    m = db.query(MaintenanceLog).filter(MaintenanceLog.id == maintenance_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    m.status = "Closed"
    m.end_date = date.today()
    # Restore vehicle to Available unless it's Retired
    vehicle = db.query(Vehicle).filter(Vehicle.id == m.vehicle_id).first()
    if vehicle and vehicle.status != "Retired":
        vehicle.status = "Available"
    db.commit()
    db.refresh(m)
    return _maintenance_to_dict(m)


# ─── FUEL LOGS ────────────────────────────────────────────────────────────────

@router.get("/fuel")
def list_fuel(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(FuelLog).order_by(FuelLog.id.desc()).all()
    return [_fuel_to_dict(f) for f in logs]


@router.post("/fuel", status_code=201)
def add_fuel(data: FuelLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    f = FuelLog(
        vehicle_id=data.vehicle_id,
        trip_id=data.trip_id,
        liters=data.liters,
        cost=data.cost,
        log_date=data.log_date,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return _fuel_to_dict(f)


# ─── EXPENSES ─────────────────────────────────────────────────────────────────

@router.get("/expenses")
def list_expenses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exps = db.query(Expense).order_by(Expense.id.desc()).all()
    return [_expense_to_dict(e) for e in exps]


@router.post("/expenses", status_code=201)
def add_expense(data: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    e = Expense(
        vehicle_id=data.vehicle_id,
        trip_id=data.trip_id,
        category=data.category,
        amount=data.amount,
        description=data.description,
        log_date=data.log_date,
    )
    db.add(e)
    db.commit()
    db.refresh(e)
    return _expense_to_dict(e)


# ─── ANALYTICS ────────────────────────────────────────────────────────────────

@router.get("/analytics/summary")
def analytics_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).all()
    drivers = db.query(Driver).all()
    trips = db.query(Trip).all()
    fuel_logs = db.query(FuelLog).all()
    maintenance_logs = db.query(MaintenanceLog).all()
    expenses = db.query(Expense).all()

    total_fuel_cost = sum(float(f.cost) for f in fuel_logs)
    total_maint_cost = sum(float(m.cost) for m in maintenance_logs)
    total_expense = sum(float(e.amount) for e in expenses)
    total_operational = total_fuel_cost + total_maint_cost

    completed = [t for t in trips if t.status == "Completed"]
    total_distance = sum(float(t.actual_distance or t.planned_distance) for t in completed)
    total_liters = sum(float(f.liters) for f in fuel_logs)
    fuel_efficiency = round(total_distance / total_liters, 1) if total_liters > 0 else 0

    active_vehicles = [v for v in vehicles if v.status != "Retired"]
    on_trip = [v for v in active_vehicles if v.status == "On Trip"]
    utilization = round(len(on_trip) / len(active_vehicles) * 100) if active_vehicles else 0

    return {
        "totalFuelCost": total_fuel_cost,
        "totalMaintenanceCost": total_maint_cost,
        "totalExpense": total_expense,
        "totalOperationalCost": total_operational,
        "fuelEfficiency": fuel_efficiency,
        "fleetUtilization": utilization,
        "vehicleCount": len(vehicles),
        "driverCount": len(drivers),
        "tripCount": len(trips),
        "completedTrips": len(completed),
        "activeTrips": len([t for t in trips if t.status == "Dispatched"]),
        "pendingTrips": len([t for t in trips if t.status == "Draft"]),
    }


# ─── ROOT ─────────────────────────────────────────────────────────────────────

@router.get("/")
def home():
    return {"status": "TransitOps API Active", "docs": "/docs"}