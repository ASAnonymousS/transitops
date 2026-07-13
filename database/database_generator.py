"""
database_generator.py
----------------------
Populates the `transitops` MariaDB/MySQL database (see schema.sql) with
realistic fake data using Faker + SQLAlchemy.

What it does:
    1. Connects to the database defined by DATABASE_URL.
    2. Wipes existing rows from all 7 tables (TRUNCATE, FK checks disabled).
    3. Generates and bulk-inserts fake rows in dependency order:
           vehicles, drivers, users  ->  trips  ->  expenses, fuel_logs, maintenance_logs
    4. Keeps data relationally consistent, e.g.:
           - an expense/fuel log tied to a trip always uses that trip's vehicle_id
           - cargo_weight never exceeds the assigned vehicle's max_capacity
           - actual_distance/fuel_consumed/completed_at are only set for
             trips that are actually Completed

Usage:
    pip install faker sqlalchemy pymysql
    python database_generator.py

Tweak NUM_* and SEED below to control how much data is generated and
whether the output is reproducible between runs.
"""

import os
import random
import string
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from dotenv import load_dotenv
from faker import Faker
from sqlalchemy import create_engine, text

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL", None
)

if DATABASE_URL is None:
    print("Database envrionment variable not defined.")
    print("Exiting")
    exit()

# How many rows to generate per table -- tweak freely.
NUM_VEHICLES = 40
NUM_DRIVERS = 35
NUM_USERS = 12
NUM_TRIPS = 300
NUM_EXPENSES = 220
NUM_FUEL_LOGS = 280
NUM_MAINTENANCE_LOGS = 130

# Set to an int (e.g. 42) for reproducible output between runs.
SEED = 1

engine = create_engine(DATABASE_URL, echo=False) # Database connectivity

fake = Faker()

if SEED is not None:
    random.seed(SEED)
    Faker.seed(SEED)

# ---------------------------------------------------------------------------
# Reference / lookup data
# ---------------------------------------------------------------------------

# (model, vehicle type) pairs so a model never ends up paired with a
# nonsensical type (e.g. a "Sprinter Van" labeled as a "Tanker").
VEHICLE_CATALOG = [
    ("Ford Transit 350", "Van"),
    ("Mercedes-Benz Sprinter", "Van"),
    ("RAM ProMaster 2500", "Van"),
    ("Freightliner Cascadia", "Truck"),
    ("Volvo FH16", "Truck"),
    ("Kenworth T680", "Truck"),
    ("Peterbilt 579", "Truck"),
    ("Mack Anthem", "Truck"),
    ("Isuzu NPR-HD", "Box Truck"),
    ("Hino 268", "Box Truck"),
    ("International MV Series", "Box Truck"),
    ("Great Dane Dry Van Trailer", "Trailer"),
    ("Wabash Flatbed Trailer", "Flatbed"),
    ("Utility Reefer Trailer", "Refrigerated Truck"),
    ("Ford F-350", "Pickup"),
    ("Chevrolet Silverado 3500HD", "Pickup"),
    ("Polar Tank Trailer", "Tanker"),
]

LICENSE_CATEGORIES = ["Class A CDL", "Class B CDL", "Class C CDL", "Non-CDL"]

DRIVER_STATUSES = ["Available", "On Trip", "Off Duty", "Suspended"]
DRIVER_STATUS_WEIGHTS = [45, 30, 20, 5]

VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"]
VEHICLE_STATUS_WEIGHTS = [45, 30, 15, 10]

TRIP_STATUSES = ["Draft", "Dispatched", "Completed", "Cancelled"]
TRIP_STATUS_WEIGHTS = [8, 17, 65, 10]

MAINTENANCE_STATUSES = ["Active", "Closed"]
MAINTENANCE_STATUS_WEIGHTS = [20, 80]

USER_ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]

REGIONS = ["North", "South", "East", "West", "Central",
           "Northeast", "Northwest", "Southeast", "Southwest"]

EXPENSE_CATEGORIES = ["Toll", "Parking", "Permit", "Traffic Fine", "Loading Fee",
                       "Driver Allowance", "Cleaning", "Miscellaneous"]

MAINTENANCE_DESCRIPTIONS = [
    "Routine oil change and filter replacement",
    "Brake pad and rotor replacement",
    "Tire rotation and wheel alignment",
    "Full engine diagnostic and tune-up",
    "Transmission fluid service",
    "Battery inspection and replacement",
    "Annual DOT safety and emissions inspection",
    "Suspension and shock absorber repair",
    "Air conditioning system service",
    "Coolant system flush",
    "Brake fluid replacement",
    "Windshield wiper and headlight replacement",
    "Wheel bearing replacement",
    "Exhaust system repair",
    "Scheduled 50,000-mile service",
]

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def weighted_choice(options, weights):
    return random.choices(options, weights=weights, k=1)[0]


def rand_decimal(min_val, max_val, ndigits=2):
    """Random Decimal in [min_val, max_val], free of float rounding noise."""
    value = round(random.uniform(min_val, max_val), ndigits)
    return Decimal(str(value))


def maybe(value, null_chance=0.1):
    """Return None `null_chance` of the time, else `value`."""
    return None if random.random() < null_chance else value


def fake_phone():
    # Fixed-width format so it always fits contact_number varchar(20)
    return fake.numerify("+1-###-###-####")


def fake_password_hash():
    # Bcrypt-shaped placeholder string -- NOT a real hash of any real password.
    alphabet = string.ascii_letters + string.digits + "./"
    salt = "".join(random.choices(alphabet, k=22))
    body = "".join(random.choices(alphabet, k=31))
    return f"$2b$12${salt}{body}"


def unique_license_plate(used):
    plate = fake.license_plate()
    while plate in used:
        plate = fake.license_plate()
    used.add(plate)
    return plate


def unique_license_number(used):
    number = f"DL{fake.random_number(digits=8, fix_len=True)}"
    while number in used:
        number = f"DL{fake.random_number(digits=8, fix_len=True)}"
    used.add(number)
    return number


def unique_email(used):
    first, last = fake.first_name(), fake.last_name()
    base = f"{first}.{last}".lower()
    email = f"{base}@transitops-demo.com"
    suffix = 1
    while email in used:
        suffix += 1
        email = f"{base}{suffix}@transitops-demo.com"
    used.add(email)
    return email

# ---------------------------------------------------------------------------
# Row generators -- each returns a list[dict]; no "id" key (DB assigns it).
# ---------------------------------------------------------------------------

def generate_vehicles(n):
    used_plates = set()
    rows = []
    for _ in range(n):
        model, vtype = random.choice(VEHICLE_CATALOG)
        rows.append({
            "registration_number": unique_license_plate(used_plates),
            "model": model,
            "type": vtype,
            "max_capacity": rand_decimal(800, 24000),
            "odometer": rand_decimal(0, 300000),
            "acquisition_cost": rand_decimal(15000, 180000),
            "region": maybe(random.choice(REGIONS), null_chance=0.05),
            "status": weighted_choice(VEHICLE_STATUSES, VEHICLE_STATUS_WEIGHTS),
            "created_at": fake.date_time_between(start_date="-3y", end_date="-1d"),
        })
    return rows


def generate_drivers(n):
    used_licenses = set()
    rows = []
    for _ in range(n):
        rows.append({
            "name": fake.name(),
            "license_number": unique_license_number(used_licenses),
            "license_category": random.choice(LICENSE_CATEGORIES),
            "license_expiry": fake.date_between(start_date="-6m", end_date="+5y"),
            "contact_number": maybe(fake_phone(), null_chance=0.1),
            "safety_score": Decimal(str(round(random.triangular(55, 100, 92), 2))),
            "status": weighted_choice(DRIVER_STATUSES, DRIVER_STATUS_WEIGHTS),
            "created_at": fake.date_time_between(start_date="-3y", end_date="-1d"),
        })
    return rows


def generate_users(n):
    used_emails = set()
    rows = []
    for _ in range(n):
        rows.append({
            "email": unique_email(used_emails),
            "password_hash": fake_password_hash(),
            "role": random.choice(USER_ROLES),
            "created_at": fake.date_time_between(start_date="-3y", end_date="-1d"),
        })
    return rows


def generate_trips(n, vehicles, drivers):
    rows = []
    for _ in range(n):
        vehicle = random.choice(vehicles)
        driver = random.choice(drivers)
        status = weighted_choice(TRIP_STATUSES, TRIP_STATUS_WEIGHTS)

        source = fake.city()
        destination = fake.city()
        while destination == source:
            destination = fake.city()

        created_at = fake.date_time_between(start_date="-2y", end_date="-4d")
        planned_distance = rand_decimal(15, 2200)

        cap = float(vehicle["max_capacity"])
        cargo_weight = rand_decimal(max(80.0, cap * 0.1), cap)

        actual_distance = None
        fuel_consumed = None
        completed_at = None
        revenue = Decimal("0.00")

        if status == "Completed":
            variance = random.uniform(-0.08, 0.08)
            actual_distance = Decimal(str(round(float(planned_distance) * (1 + variance), 2)))
            fuel_consumed = Decimal(str(round(float(actual_distance) * random.uniform(0.25, 0.45), 2)))
            completed_at = created_at + timedelta(hours=random.randint(3, 96))
            revenue = Decimal(str(round(
                float(planned_distance) * random.uniform(2.5, 6.5)
                + float(cargo_weight) * random.uniform(0.05, 0.2), 2)))
        elif status == "Dispatched":
            revenue = Decimal(str(round(float(planned_distance) * random.uniform(2.5, 6.5), 2)))

        rows.append({
            "vehicle_id": vehicle["id"],
            "driver_id": driver["id"],
            "source": source,
            "destination": destination,
            "cargo_weight": cargo_weight,
            "planned_distance": planned_distance,
            "actual_distance": actual_distance,
            "fuel_consumed": fuel_consumed,
            "revenue": revenue,
            "status": status,
            "created_at": created_at,
            "completed_at": completed_at,
        })
    return rows


def generate_expenses(n, vehicles, trips):
    # Only trips that have actually left "Draft" could have incurred costs.
    eligible_trips = [t for t in trips if t["status"] != "Draft"]
    rows = []
    for _ in range(n):
        if eligible_trips and random.random() < 0.7:
            trip = random.choice(eligible_trips)
            vehicle_id = trip["vehicle_id"]
            trip_id = trip["id"]
            log_date = (trip["created_at"] + timedelta(days=random.randint(0, 3))).date()
        else:
            vehicle_id = random.choice(vehicles)["id"]
            trip_id = None
            log_date = fake.date_between(start_date="-2y", end_date="today")

        rows.append({
            "vehicle_id": vehicle_id,
            "trip_id": trip_id,
            "category": random.choice(EXPENSE_CATEGORIES),
            "amount": rand_decimal(5, 1800),
            "description": maybe(fake.sentence(nb_words=6), null_chance=0.15),
            "log_date": log_date,
        })
    return rows


def generate_fuel_logs(n, vehicles, trips):
    eligible_trips = [t for t in trips if t["status"] != "Draft"]
    rows = []
    for _ in range(n):
        if eligible_trips and random.random() < 0.8:
            trip = random.choice(eligible_trips)
            vehicle_id = trip["vehicle_id"]
            trip_id = trip["id"]
            log_date = (trip["created_at"] + timedelta(days=random.randint(0, 2))).date()
        else:
            vehicle_id = random.choice(vehicles)["id"]
            trip_id = None
            log_date = fake.date_between(start_date="-2y", end_date="today")

        liters = rand_decimal(20, 450)
        price_per_liter = random.uniform(0.85, 1.75)
        cost = Decimal(str(round(float(liters) * price_per_liter, 2)))

        rows.append({
            "vehicle_id": vehicle_id,
            "trip_id": trip_id,
            "liters": liters,
            "cost": cost,
            "log_date": log_date,
        })
    return rows


def generate_maintenance_logs(n, vehicles):
    rows = []
    for _ in range(n):
        vehicle_id = random.choice(vehicles)["id"]
        status = weighted_choice(MAINTENANCE_STATUSES, MAINTENANCE_STATUS_WEIGHTS)
        start_date = fake.date_between(start_date="-2y", end_date="-15d")

        end_date = None
        if status == "Closed":
            end_date = start_date + timedelta(days=random.randint(1, 14))

        rows.append({
            "vehicle_id": vehicle_id,
            "description": random.choice(MAINTENANCE_DESCRIPTIONS),
            "cost": rand_decimal(40, 6000),
            "status": status,
            "start_date": start_date,
            "end_date": end_date,
            "created_at": datetime.combine(start_date, datetime.min.time())
            + timedelta(hours=random.randint(6, 20)),
        })
    return rows

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

# Child tables first, so FK checks would be satisfied even without disabling them.
TABLE_ORDER_FOR_CLEAR = [
    "maintenance_logs", "fuel_logs", "expenses", "trips", "users", "drivers", "vehicles",
]


def clear_existing_data(conn):
    conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
    for table in TABLE_ORDER_FOR_CLEAR:
        conn.execute(text(f"TRUNCATE TABLE `{table}`"))
    conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))


def bulk_insert(conn, table, rows):
    if not rows:
        return
    columns = list(rows[0].keys())
    col_sql = ", ".join(f"`{c}`" for c in columns)
    val_sql = ", ".join(f":{c}" for c in columns)
    stmt = text(f"INSERT INTO `{table}` ({col_sql}) VALUES ({val_sql})")
    conn.execute(stmt, rows)


def bulk_insert_and_attach_ids(conn, table, rows):
    """Inserts rows, then reads the ids the DB assigned back into each dict.

    Relies on the table having just been TRUNCATEd and on this script being
    the only writer, so ids come back 1..N in the same order the rows were
    generated -- which is what lets later tables reference them as FKs.
    """
    bulk_insert(conn, table, rows)
    result = conn.execute(text(f"SELECT id FROM `{table}` ORDER BY id"))
    ids = [row[0] for row in result]
    for row, new_id in zip(rows, ids):
        row["id"] = new_id
    return rows

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    masked_target = DATABASE_URL.split("@")[-1]
    print(f"Connecting to {masked_target} ...")

    with engine.connect() as conn:
        result = conn.execute(text("SELECT 'Connection Successful!'"))
        print(result.all())

        print("Clearing existing data from all tables...")
        clear_existing_data(conn)
        conn.commit()

        print(f"Generating {NUM_VEHICLES} vehicles...")
        vehicles = bulk_insert_and_attach_ids(conn, "vehicles", generate_vehicles(NUM_VEHICLES))

        print(f"Generating {NUM_DRIVERS} drivers...")
        drivers = bulk_insert_and_attach_ids(conn, "drivers", generate_drivers(NUM_DRIVERS))

        print(f"Generating {NUM_USERS} users...")
        bulk_insert_and_attach_ids(conn, "users", generate_users(NUM_USERS))

        print(f"Generating {NUM_TRIPS} trips...")
        trips = bulk_insert_and_attach_ids(conn, "trips", generate_trips(NUM_TRIPS, vehicles, drivers))

        print(f"Generating {NUM_EXPENSES} expenses...")
        bulk_insert(conn, "expenses", generate_expenses(NUM_EXPENSES, vehicles, trips))

        print(f"Generating {NUM_FUEL_LOGS} fuel logs...")
        bulk_insert(conn, "fuel_logs", generate_fuel_logs(NUM_FUEL_LOGS, vehicles, trips))

        print(f"Generating {NUM_MAINTENANCE_LOGS} maintenance logs...")
        bulk_insert(conn, "maintenance_logs", generate_maintenance_logs(NUM_MAINTENANCE_LOGS, vehicles))

        conn.commit()

    print("Done! All tables populated.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)