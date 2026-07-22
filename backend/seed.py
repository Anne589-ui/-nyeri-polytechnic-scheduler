"""
Run once after creating the database:
    python seed.py
Creates tables + default users for all three roles.
"""
from database import engine, Base, SessionLocal
from models import User, Room, Instructor,Course
from auth import hash_password
import models  # noqa — ensures all models are registered

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Default users ─────────────────────────────────────────────────────
default_users = [
    {"username": "admin",   "full_name": "System Administrator", "role": "admin",            "password": "admin123"},
    {"username": "deputy",  "full_name": "Ms. Achieng",          "role": "deputy_principal", "password": "deputy123"},
    {"username": "kariuki", "full_name": "Mr. Kariuki",          "role": "instructor",       "password": "instr123"},
    {"username": "wanjiku", "full_name": "Ms. Wanjiku",          "role": "instructor",       "password": "instr123"},
    {"username": "omondi",  "full_name": "Mr. Omondi",           "role": "instructor",       "password": "instr123"},
]

for u in default_users:
    if not db.query(User).filter(User.username == u["username"]).first():
        db.add(User(
            username=u["username"],
            full_name=u["full_name"],
            role=u["role"],
            hashed_password=hash_password(u["password"]),
        ))

# ── Courses ───────────────────────────────────────────────────────────
default_courses = [
    {"name": "Driving Theory",    "duration_hrs": 2},
    {"name": "Plumbing",          "duration_hrs": 3},
    {"name": "Computer Literacy", "duration_hrs": 2},
    {"name": "Electrical Wiring", "duration_hrs": 3},
    {"name": "Carpentry",         "duration_hrs": 3},
    {"name": "Welding",           "duration_hrs": 2},
    {"name": "Tailoring",         "duration_hrs": 2},
    {"name": "Catering",          "duration_hrs": 3},
]
for c in default_courses:
    if not db.query(Course).filter(Course.name == c["name"]).first():db.add(Course(**c))


# ── Default rooms ─────────────────────────────────────────────────────
default_rooms = [
    {"name": "Room A", "capacity": 30},
    {"name": "Room B", "capacity": 20},
    {"name": "Room C", "capacity": 15},
]

for r in default_rooms:
    if not db.query(Room).filter(Room.name == r["name"]).first():
        db.add(Room(**r))

# ── Default instructors ───────────────────────────────────────────────
default_instructors = [
    {"name": "Mr. Kariuki"},
    {"name": "Ms. Wanjiku"},
    {"name": "Mr. Omondi"},
]

for i in default_instructors:
    if not db.query(Instructor).filter(Instructor.name == i["name"]).first():
        db.add(Instructor(**i))

db.commit()
db.close()
print("✓ Database seeded successfully.")