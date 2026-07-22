from scheduler import generate_timetable
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, Base
import models, crud, schemas
from clash_detector import detect_clashes
from auth import verify_password, create_access_token, get_current_user, require_roles

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Nyeri Polytechnic Scheduler",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    except Exception as e:
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
    except Exception as e:
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

    # Get all existing classes
    existing = crud.get_classes(db)

    # Build a temporary class object to test for clashes
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

    # Run clash detection including the new class
    clashes = detect_clashes(existing + [test_class])

    # Filter only clashes that involve the new class
    new_clashes = [c for c in clashes if -1 in c.class_ids]

    if new_clashes:
        reasons = "; ".join([c.detail for c in new_clashes])
        raise HTTPException(
            status_code=409,
            detail=f"Class not added — clash detected: {reasons}"
        )

    # No clashes found — safe to save
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
# ── Auto-generate timetable ───────────────────────────────────────────
@app.post("/timetable/generate", tags=["Timetable"])
def auto_generate_timetable(
    db: Session = Depends(get_db),
    _=Depends(require_roles("admin", "deputy_principal")),
):
    success, message, assignments = generate_timetable(db)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {
        "message": message,
        "total": len(assignments),
        "assignments": assignments,
    }