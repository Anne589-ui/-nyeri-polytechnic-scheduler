from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
import models, crud, schemas
from clash_detector import detect_clashes
from auth import verify_password, create_access_token, get_current_user, require_roles, hash_password
from scheduler import generate_timetable

Base.metadata.create_all(bind=engine)


def auto_seed():
    """Seed default data on first startup if tables are empty."""
    from database import SessionLocal
    from models import User, Room, Instructor, Course

    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        print("Seeding database...")

        users = [
            {"username": "admin",   "full_name": "System Administrator", "role": "admin",            "password": "admin123"},
            {"username": "deputy",  "full_name": "Ms. Achieng",          "role": "deputy_principal", "password": "deputy123"},
            {"username": "kariuki", "full_name": "Mr. Kariuki",          "role": "instructor",       "password": "instr123"},
            {"username": "wanjiku", "full_name": "Ms. Wanjiku",          "role": "instructor",       "password": "instr123"},
            {"username": "omondi",  "full_name": "Mr. Omondi",           "role": "instructor",       "password": "instr123"},
        ]
        for u in users:
            db.add(User(
                username=u["username"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=hash_password(u["password"]),
            ))

        courses = [
            {"name": "Driving Theory",    "duration_hrs": 2},
            {"name": "Plumbing",          "duration_hrs": 3},
            {"name": "Computer Literacy", "duration_hrs": 2},
            {"name": "Electrical Wiring", "duration_hrs": 3},
            {"name": "Carpentry",         "duration_hrs": 3},
            {"name": "Welding",           "duration_hrs": 2},
            {"name": "Tailoring",         "duration_hrs": 2},
            {"name": "Catering",          "duration_hrs": 3},
        ]
        for c in courses:
            db.add(Course(**c))

        rooms = [
            {"name": "Room A", "capacity": 30},
            {"name": "Room B", "capacity": 20},
            {"name": "Room C", "capacity": 15},
        ]
        for r in rooms:
            db.add(Room(**r))

        instructors = [
            {"name": "Mr. Kariuki"},
            {"name": "Ms. Wanjiku"},
            {"name": "Mr. Omondi"},
        ]
        for i in instructors:
            db.add(Instructor(**i))

        db.commit()
        print("✓ Database seeded successfully.")

    except Exception as e:
        print(f"Seeding skipped: {e}")
        db.rollback()
    finally:
        db.close()


auto_seed()


app = FastAPI(
    title="Nyeri Polytechnic Scheduler",
    version="2.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
)


origins = [
    "http://localhost:5173",
    "https://nyeri-polytechnic-scheduler.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Auth ──────────────────────────────────────────────────────────────
@app.post("/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, body.username)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
    }

@app.get("/auth/me", response_model=schemas.UserOut, tags=["Auth"])
def me(current_user=Depends(get_current_user)):
    return current_user


# ── Users ─────────────────────────────────────────────────────────────
@app.get("/users", response_model=List[schemas.UserOut], tags=["Users"])
def list_users(db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    return crud.get_users(db)

@app.post("/users", response_model=schemas.UserOut, tags=["Users"])
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db),
                _=Depends(require_roles("admin"))):
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.create_user(db, user)

@app.delete("/users/{user_id}", tags=["Users"])
def remove_user(user_id: int, db: Session = Depends(get_db),
                _=Depends(require_roles("admin"))):
    obj = crud.delete_user(db, user_id)
    if not obj:
        raise HTTPException(status_code=404, detail="User not found")
    return {"deleted": user_id}


# ── Courses ───────────────────────────────────────────────────────────
@app.get("/courses", response_model=List[schemas.CourseOut], tags=["Courses"])
def list_courses(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_courses(db)

@app.post("/courses", response_model=schemas.CourseOut, tags=["Courses"])
def add_course(course: schemas.CourseBase, db: Session = Depends(get_db),
               _=Depends(require_roles("admin", "deputy_principal"))):
    try:
        return crud.create_course(db, course)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/courses/{course_id}", tags=["Courses"])
def remove_course(course_id: int, db: Session = Depends(get_db),
                  _=Depends(require_roles("admin", "deputy_principal"))):
    obj = crud.delete_course(db, course_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"deleted": course_id}


# ── Rooms ─────────────────────────────────────────────────────────────
@app.get("/rooms", response_model=List[schemas.RoomOut], tags=["Rooms"])
def list_rooms(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_rooms(db)

@app.post("/rooms", response_model=schemas.RoomOut, tags=["Rooms"])
def add_room(room: schemas.RoomBase, db: Session = Depends(get_db),
             _=Depends(require_roles("admin", "deputy_principal"))):
    try:
        return crud.create_room(db, room)
    except Exception:
        raise HTTPException(status_code=400, detail="Room name already exists")

@app.delete("/rooms/{room_id}", tags=["Rooms"])
def remove_room(room_id: int, db: Session = Depends(get_db),
                _=Depends(require_roles("admin", "deputy_principal"))):
    obj = crud.delete_room(db, room_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"deleted": room_id}


# ── Instructors ───────────────────────────────────────────────────────
@app.get("/instructors", response_model=List[schemas.InstructorOut], tags=["Instructors"])
def list_instructors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_instructors(db)

@app.post("/instructors", response_model=schemas.InstructorOut, tags=["Instructors"])
def add_instructor(inst: schemas.InstructorBase, db: Session = Depends(get_db),
                   _=Depends(require_roles("admin", "deputy_principal"))):
    try:
        return crud.create_instructor(db, inst)
    except Exception:
        raise HTTPException(status_code=400, detail="Instructor name already exists")

@app.delete("/instructors/{instructor_id}", tags=["Instructors"])
def remove_instructor(instructor_id: int, db: Session = Depends(get_db),
                      _=Depends(require_roles("admin", "deputy_principal"))):
    obj = crud.delete_instructor(db, instructor_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Instructor not found")
    return {"deleted": instructor_id}


# ── Scheduled Classes ─────────────────────────────────────────────────
@app.get("/classes", response_model=List[schemas.ClassOut], tags=["Classes"])
def list_classes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return crud.get_classes(db)

@app.post("/classes", response_model=schemas.ClassOut, tags=["Classes"])
def add_class(cls: schemas.ClassIn, db: Session = Depends(get_db),
              _=Depends(require_roles("admin", "deputy_principal"))):
    existing = crud.get_classes(db)
    from models import ScheduledClass as SC
    test_class = SC(
        id=-1,
        course=cls.course,
        room_id=cls.room_id,
        instructor_id=cls.instructor_id,
        day=cls.day,
        start_time=cls.start_time,
        end_time=cls.end_time,
    )
    clashes = detect_clashes(existing + [test_class])
    new_clashes = [c for c in clashes if -1 in c.class_ids]
    if new_clashes:
        reasons = "; ".join([c.detail for c in new_clashes])
        raise HTTPException(
            status_code=409,
            detail=f"Class not added — clash detected: {reasons}"
        )
    return crud.create_class(db, cls)

@app.delete("/classes/{class_id}", tags=["Classes"])
def remove_class(class_id: int, db: Session = Depends(get_db),
                 _=Depends(require_roles("admin", "deputy_principal"))):
    obj = crud.delete_class(db, class_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"deleted": class_id}


# ── Clash Detection ───────────────────────────────────────────────────
@app.get("/clashes", response_model=List[schemas.Clash], tags=["Clashes"])
def get_clashes(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return detect_clashes(crud.get_classes(db))


# ── Auto-Generate Timetable ───────────────────────────────────────────
@app.post("/schedule/generate", tags=["Scheduler"])
def auto_generate(
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "deputy_principal")),
):
    courses     = crud.get_courses(db)
    rooms       = crud.get_rooms(db)
    instructors = crud.get_instructors(db)

    if not courses:
        raise HTTPException(status_code=400, detail="No courses found. Add courses first.")
    if not rooms:
        raise HTTPException(status_code=400, detail="No rooms found. Add rooms first.")
    if not instructors:
        raise HTTPException(status_code=400, detail="No instructors found. Add instructors first.")

    result = generate_timetable(courses, rooms, instructors)

    db.query(models.ScheduledClass).delete()
    db.commit()

    saved = []
    for item in result["scheduled"]:
        obj = models.ScheduledClass(**item)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        saved.append(obj)

    return {
        "scheduled": saved,
        "unscheduled": result["unscheduled"],
        "stats": result["stats"],
        "message": f"Successfully scheduled {result['stats']['scheduled']} of {result['stats']['total']} courses."
    }