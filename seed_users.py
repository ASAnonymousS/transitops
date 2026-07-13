import sys
import os

# Add current directory to path to allow imports from app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.models import User
from app.core.security import get_password_hash

users_to_add = [
    ("raven.k@transitops.in", "Dispatcher"),
    ("meera.f@transitops.in", "Fleet Manager"),
    ("sam.s@transitops.in", "Safety Officer"),
    ("nikhil.a@transitops.in", "Financial Analyst"),
    ("manager@transitops.com", "Fleet Manager"),
]

db = SessionLocal()

try:
    password = "password123"
    hashed_password = get_password_hash(password)

    for email, role in users_to_add:
        existing = db.query(User).filter(User.email == email).first()
        if not existing:
            new_user = User(email=email, password_hash=hashed_password, role=role)
            db.add(new_user)
            print(f"Added {email} as {role}")
        else:
            print(f"User {email} already exists")

    db.commit()
    print("Database seeding completed.")
finally:
    db.close()
