from sqlalchemy import Column, Integer, String, Date, Numeric, Enum, ForeignKey, TIMESTAMP, Text, func
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    registration_number = Column(String(50), unique=True, nullable=False)
    model = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    max_capacity = Column(Numeric(10, 2), nullable=False)
    odometer = Column(Numeric(10, 2), default=0.00)
    acquisition_cost = Column(Numeric(12, 2), nullable=False)
    region = Column(String(50), nullable=True)
    status = Column(Enum('Available', 'On Trip', 'In Shop', 'Retired'), default='Available')
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    trips = relationship("Trip", back_populates="vehicle")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle")
    expenses = relationship("Expense", back_populates="vehicle")
    fuel_logs = relationship("FuelLog", back_populates="vehicle")


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    license_number = Column(String(50), unique=True, nullable=False)
    license_category = Column(String(20), nullable=False)
    license_expiry = Column(Date, nullable=False)
    contact_number = Column(String(20), nullable=True)
    safety_score = Column(Numeric(5, 2), default=100.00)
    status = Column(Enum('Available', 'On Trip', 'Off Duty', 'Suspended'), default='Available')
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    trips = relationship("Trip", back_populates="driver")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    source = Column(String(255), nullable=False)
    destination = Column(String(255), nullable=False)
    cargo_weight = Column(Numeric(10, 2), nullable=False)
    planned_distance = Column(Numeric(10, 2), nullable=False)
    actual_distance = Column(Numeric(10, 2), nullable=True)
    fuel_consumed = Column(Numeric(10, 2), nullable=True)
    revenue = Column(Numeric(12, 2), default=0.00)
    status = Column(Enum('Draft', 'Dispatched', 'Completed', 'Cancelled'), default='Draft')
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    completed_at = Column(TIMESTAMP, nullable=True)

    vehicle = relationship("Vehicle", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    expenses = relationship("Expense", back_populates="trip")
    fuel_logs = relationship("FuelLog", back_populates="trip")


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    description = Column(Text, nullable=False)
    cost = Column(Numeric(10, 2), default=0.00)
    status = Column(Enum('Active', 'Closed'), default='Active')
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    vehicle = relationship("Vehicle", back_populates="maintenance_logs")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    liters = Column(Numeric(10, 2), nullable=False)
    cost = Column(Numeric(10, 2), nullable=False)
    log_date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle", back_populates="fuel_logs")
    trip = relationship("Trip", back_populates="fuel_logs")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    category = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    description = Column(String(255), nullable=True)
    log_date = Column(Date, nullable=False)

    vehicle = relationship("Vehicle", back_populates="expenses")
    trip = relationship("Trip", back_populates="expenses")