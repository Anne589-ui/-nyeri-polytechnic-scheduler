from sqlalchemy.orm import Session
from models import Room, Instructor, ScheduledClass, User, Course
from schemas import RoomBase, InstructorBase, ClassIn, UserCreate, CourseBase
from auth import hash_password

# ── Users ─────────────────────────────────────────────────────────────
def get_users(db: Session):
    return db.query(User).all()


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user: UserCreate):
    obj = User(
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hash_password(user.password),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_user(db: Session, user_id: int):
    obj = db.query(User).filter(User.id == user_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj

# ── Courses ───────────────────────────────────────────────────────────
def get_courses(db: Session):
    return db.query(Course).all()

def create_course(db: Session, course: CourseBase):
    existing = db.query(Course).filter(Course.name == course.name).first()
    if existing:
        raise ValueError(f"Course '{course.name}' already exists")
    obj = Course(**course.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def delete_course(db: Session, course_id: int):
    obj = db.query(Course).filter(Course.id == course_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj

# ── Rooms ─────────────────────────────────────────────────────────────
def get_rooms(db: Session):
    return db.query(Room).all()


def create_room(db: Session, room: RoomBase):
    obj = Room(**room.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_room(db: Session, room_id: int):
    obj = db.query(Room).filter(Room.id == room_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# ── Instructors ───────────────────────────────────────────────────────
def get_instructors(db: Session):
    return db.query(Instructor).all()


def create_instructor(db: Session, instructor: InstructorBase):
    obj = Instructor(**instructor.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_instructor(db: Session, instructor_id: int):
    obj = db.query(Instructor).filter(Instructor.id == instructor_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj


# ── Classes ───────────────────────────────────────────────────────────
def get_classes(db: Session):
    return db.query(ScheduledClass).all()


def create_class(db: Session, cls: ClassIn):
    obj = ScheduledClass(**cls.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_class(db: Session, class_id: int):
    obj = db.query(ScheduledClass).filter(ScheduledClass.id == class_id).first()
    if obj:
        db.delete(obj)
        db.commit()
    return obj