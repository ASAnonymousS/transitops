# # Here is the full, production-ready code for app/core/dao.py tailored exactly to your database schema. It translates incoming business values (like a registration number or license string) to their corresponding relational database IDs and enforces the strict business rules defined in your hackathon document.  File: app/core/dao.pyPythonfrom sqlalchemy.orm import Session
# from datetime import date, datetime
# from typing import List, Optional
# from backend.models.models import Vehicle, Driver, Trip # Make sure these models match your SQLAlchemy declarations

# class FleetDAO:
#     """
#     Data Access Object handling Vehicle and Driver querying and status management.
#     """
#     @staticmethod
#     def get_vehicle_by_reg(db: Session, registration_number: str) -> Optional[Vehicle]:
#         return db.query(Vehicle).filter(Vehicle.registration_number == registration_number).first()

#     @staticmethod
#     def get_driver_by_license(db: Session, license_number: str) -> Optional[Driver]:
#         return db.query(Driver).filter(Driver.license_number == license_number).first()

#     @staticmethod
#     def get_dispatch_ready_vehicles(db: Session) -> List[Vehicle]:
#         # MANDATORY RULE: Retired or In Shop vehicles must never appear in the dispatch selection
#         return db.query(Vehicle).filter(Vehicle.status == "Available").all()

#     @staticmethod
#     def get_dispatch_ready_drivers(db: Session) -> List[Driver]:
#         # MANDATORY RULE: Drivers with expired licenses or Suspended status cannot be assigned to trips[cite: 1]
#         return db.query(Driver).filter(
#             Driver.status == "Available",
#             Driver.license_expiry >= date.today()
#         ).all()

#     @staticmethod
#     def update_vehicle_status(db: Session, vehicle_id: int, new_status: str) -> Optional[Vehicle]:
#         vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
#         if vehicle:
#             vehicle.status = new_status
#             db.commit()
#             db.refresh(vehicle)
#         return vehicle

#     @staticmethod
#     def update_driver_status(db: Session, driver_id: int, new_status: str) -> Optional[Driver]:
#         driver = db.query(Driver).filter(Driver.id == driver_id).first()
#         if driver:
#             driver.status = new_status
#             db.commit()
#             db.refresh(driver)
#         return driver


# class TripDAO:
#     """
#     Data Access Object handling Trip operations and enforcing critical validation constraints.
#     """
#     @staticmethod
#     def create_trip(db: Session, source: str, destination: str, vehicle_reg: str, driver_license: str, cargo_weight: float, planned_distance: float) -> Trip:
#         # 1. Resolve registration strings to their live DB entity rows
#         vehicle = FleetDAO.get_vehicle_by_reg(db, vehicle_reg)
#         driver = FleetDAO.get_driver_by_license(db, driver_license)

#         if not vehicle or not driver:
#             raise ValueError("Requested Vehicle or Driver records do not exist in the database.")

#         # 2. ENFORCE HACKATHON MANDATORY BUSINESS RULES[cite: 1]
        
#         # Rule A: Retired or In Shop vehicles must never appear in the dispatch selection[cite: 1]
#         if vehicle.status in ["Retired", "In Shop"]:
#             raise ValueError(f"Dispatch Denied: Vehicle status is currently '{vehicle.status}'.")

#         # Rule B: Drivers with expired licenses or Suspended status cannot be assigned to trips[cite: 1]
#         if driver.status == "Suspended":
#             raise ValueError("Dispatch Denied: Target Driver is suspended.")
#         if driver.license_expiry < date.today():
#             raise ValueError("Dispatch Denied: Target Driver license has expired.")

#         # Rule C: A driver or vehicle already marked On Trip cannot be assigned to another trip[cite: 1]
#         if vehicle.status == "On Trip":
#             raise ValueError("Dispatch Denied: Target Vehicle is already assigned to an active trip.")
#         if driver.status == "On Trip":
#             raise ValueError("Dispatch Denied: Target Driver is already running an active trip.")

#         # Rule D: Cargo Weight must not exceed the vehicle's maximum load capacity[cite: 1]
#         # Evaluated using the 'max_capacity' schema field columns
#         if cargo_weight > float(vehicle.max_capacity):
#             raise ValueError(f"Dispatch Denied: Cargo weight ({cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_capacity} kg).")

#         # 3. RUN AUTOMATIC STATUS TRANSITIONS[cite: 1]
#         # Dispatching a trip automatically changes both the vehicle and driver status to On Trip[cite: 1]
#         vehicle.status = "On Trip"
#         driver.status = "On Trip"

#         # 4. Generate and commit the relational row entry
#         new_trip = Trip(
#             vehicle_id=vehicle.id,  # Maps foreign key vehicle target ID
#             driver_id=driver.id,    # Maps foreign key driver target ID
#             source=source,
#             destination=destination,
#             cargo_weight=cargo_weight,
#             planned_distance=planned_distance,
#             status="Dispatched"     # Sets status lifecycle to dispatched[cite: 1]
#         )
#         db.add(new_trip)
#         db.commit()
#         db.refresh(new_trip)
#         return new_trip

#     @staticmethod
#     def complete_trip(db: Session, trip_id: int, final_odometer: float, fuel_consumed: float) -> Optional[Trip]:
#         """
#         Completes an active trip, sets assets back to Available, and records tracking logs.
#         """
#         trip = db.query(Trip).filter(Trip.id == trip_id).first()
#         if not trip:
#             return None

#         # Fetch underlying assets to release them
#         vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
#         driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

#         # Update Odometer value constraints if provided
#         if vehicle and final_odometer > float(vehicle.odometer):
#             vehicle.odometer = final_odometer

#         # Completing a trip automatically changes both the vehicle and driver status back to Available[cite: 1]
#         if vehicle:
#             vehicle.status = "Available"
#         if driver:
#             driver.status = "Available"

#         # Update trip stats metadata
#         trip.status = "Completed"
#         trip.fuel_consumed = fuel_consumed
#         trip.completed_at = datetime.utcnow()

#         db.commit()
#         db.refresh(trip)
#         return trip

#     @staticmethod
#     def cancel_trip(db: Session, trip_id: int) -> Optional[Trip]:
#         """
#         Cancels a dispatched trip and restores assets to Available state.
#         """
#         trip = db.query(Trip).filter(Trip.id == trip_id).first()
#         if not trip:
#             return None

#         # Cancelling a dispatched trip restores the vehicle and driver to Available[cite: 1]
#         FleetDAO.update_vehicle_status(db, trip.vehicle_id, "Available")
#         FleetDAO.update_driver_status(db, trip.driver_id, "Available")

#         trip.status = "Cancelled"
#         db.commit()
#         db.refresh(trip)
#         return trip
# #💡 Key updates made to match your schema exactly:Relational Mapping: Instead of storing raw strings like vehicle_reg inside the trips table, it resolves the input to its respective table entry and assigns the real foreign keys (vehicle_id and driver_id) as required by your relational trips table setup.Column Name Adjustments: Changed max_load_capacity references to max_capacity to align perfectly with your exact vehicles table syntax parameters.Complete Workflows: Added cancel_trip and complete_trip methods to completely wrap the lifecycle business rules specified in the core prompt assignment guidelines (including odometer adjustments)[cite: 1].

"""
app/core/dao.py

Data Access Objects: Vehicle/Driver querying + status management (FleetDAO),
and Trip dispatch/completion/cancellation with the mandatory business rules
enforced (TripDAO).
"""
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Optional
from backend.models.models import Vehicle, Driver, Trip # Make sure these models match your SQLAlchemy declarations

class FleetDAO:
    """
    Data Access Object handling Vehicle and Driver querying and status management.
    """
    @staticmethod
    def get_vehicle_by_reg(db: Session, registration_number: str) -> Optional[Vehicle]:
        return db.query(Vehicle).filter(Vehicle.registration_number == registration_number).first()

    @staticmethod
    def get_driver_by_license(db: Session, license_number: str) -> Optional[Driver]:
        return db.query(Driver).filter(Driver.license_number == license_number).first()

    @staticmethod
    def get_dispatch_ready_vehicles(db: Session) -> List[Vehicle]:
        # MANDATORY RULE: Retired or In Shop vehicles must never appear in the dispatch selection
        return db.query(Vehicle).filter(Vehicle.status == "Available").all()

    @staticmethod
    def get_dispatch_ready_drivers(db: Session) -> List[Driver]:
        # MANDATORY RULE: Drivers with expired licenses or Suspended status cannot be assigned to trips[cite: 1]
        return db.query(Driver).filter(
            Driver.status == "Available",
            Driver.license_expiry >= date.today()
        ).all()

    @staticmethod
    def update_vehicle_status(db: Session, vehicle_id: int, new_status: str) -> Optional[Vehicle]:
        vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
        if vehicle:
            vehicle.status = new_status
            db.commit()
            db.refresh(vehicle)
        return vehicle

    @staticmethod
    def update_driver_status(db: Session, driver_id: int, new_status: str) -> Optional[Driver]:
        driver = db.query(Driver).filter(Driver.id == driver_id).first()
        if driver:
            driver.status = new_status
            db.commit()
            db.refresh(driver)
        return driver


class TripDAO:
    """
    Data Access Object handling Trip operations and enforcing critical validation constraints.
    """
    @staticmethod
    def create_trip(db: Session, source: str, destination: str, vehicle_reg: str, driver_license: str, cargo_weight: float, planned_distance: float) -> Trip:
        # 1. Resolve registration strings to their live DB entity rows
        vehicle = FleetDAO.get_vehicle_by_reg(db, vehicle_reg)
        driver = FleetDAO.get_driver_by_license(db, driver_license)

        if not vehicle or not driver:
            raise ValueError("Requested Vehicle or Driver records do not exist in the database.")

        # 2. ENFORCE HACKATHON MANDATORY BUSINESS RULES[cite: 1]
        
        # Rule A: Retired or In Shop vehicles must never appear in the dispatch selection[cite: 1]
        if vehicle.status in ["Retired", "In Shop"]:
            raise ValueError(f"Dispatch Denied: Vehicle status is currently '{vehicle.status}'.")

        # Rule B: Drivers with expired licenses or Suspended status cannot be assigned to trips[cite: 1]
        if driver.status == "Suspended":
            raise ValueError("Dispatch Denied: Target Driver is suspended.")
        if driver.license_expiry < date.today():
            raise ValueError("Dispatch Denied: Target Driver license has expired.")

        # Rule C: A driver or vehicle already marked On Trip cannot be assigned to another trip[cite: 1]
        if vehicle.status == "On Trip":
            raise ValueError("Dispatch Denied: Target Vehicle is already assigned to an active trip.")
        if driver.status == "On Trip":
            raise ValueError("Dispatch Denied: Target Driver is already running an active trip.")

        # Rule D: Cargo Weight must not exceed the vehicle's maximum load capacity[cite: 1]
        # Evaluated using the 'max_capacity' schema field columns
        if cargo_weight > float(vehicle.max_capacity):
            raise ValueError(f"Dispatch Denied: Cargo weight ({cargo_weight} kg) exceeds vehicle maximum capacity ({vehicle.max_capacity} kg).")

        # 3. RUN AUTOMATIC STATUS TRANSITIONS[cite: 1]
        # Dispatching a trip automatically changes both the vehicle and driver status to On Trip[cite: 1]
        vehicle.status = "On Trip"
        driver.status = "On Trip"

        # 4. Generate and commit the relational row entry
        new_trip = Trip(
            vehicle_id=vehicle.id,  # Maps foreign key vehicle target ID
            driver_id=driver.id,    # Maps foreign key driver target ID
            source=source,
            destination=destination,
            cargo_weight=cargo_weight,
            planned_distance=planned_distance,
            status="Dispatched"     # Sets status lifecycle to dispatched[cite: 1]
        )
        db.add(new_trip)
        db.commit()
        db.refresh(new_trip)
        return new_trip

    @staticmethod
    def complete_trip(db: Session, trip_id: int, final_odometer: float, fuel_consumed: float) -> Optional[Trip]:
        """
        Completes an active trip, sets assets back to Available, and records tracking logs.
        """
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            return None

        # Fetch underlying assets to release them
        vehicle = db.query(Vehicle).filter(Vehicle.id == trip.vehicle_id).first()
        driver = db.query(Driver).filter(Driver.id == trip.driver_id).first()

        # Update Odometer value constraints if provided
        if vehicle and final_odometer > float(vehicle.odometer):
            vehicle.odometer = final_odometer

        # Completing a trip automatically changes both the vehicle and driver status back to Available[cite: 1]
        if vehicle:
            vehicle.status = "Available"
        if driver:
            driver.status = "Available"

        # Update trip stats metadata
        trip.status = "Completed"
        trip.fuel_consumed = fuel_consumed
        trip.completed_at = datetime.utcnow()

        db.commit()
        db.refresh(trip)
        return trip

    @staticmethod
    def cancel_trip(db: Session, trip_id: int) -> Optional[Trip]:
        """
        Cancels a dispatched trip and restores assets to Available state.
        """
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            return None

        # Cancelling a dispatched trip restores the vehicle and driver to Available[cite: 1]
        FleetDAO.update_vehicle_status(db, trip.vehicle_id, "Available")
        FleetDAO.update_driver_status(db, trip.driver_id, "Available")

        trip.status = "Cancelled"
        db.commit()
        db.refresh(trip)
        return trip