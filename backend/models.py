from sqlalchemy import Column, Integer, String
from database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(100), unique=True, nullable=False, index=True)
    full_name       = Column(String(150), nullable=False)
    role            = Column(String(50), nullable=False)  # admin | deputy_principal | instructor
    hashed_password = Column(String(255), nullable=False)


class Room(Base):
    __tablename__ = "rooms"

    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)


class Instructor(Base):
    __tablename__ = "instructors"

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)

class Course(Base):
    __tablename__ = "courses"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(150), unique=True, nullable=False)
    duration_hrs = Column(Integer, nullable=False, default=2)

class ScheduledClass(Base):
    __tablename__ = "scheduled_classes"

    id            = Column(Integer, primary_key=True, index=True)
    course        = Column(String(100), nullable=False)
    room_id       = Column(Integer, nullable=False)
    instructor_id = Column(Integer, nullable=False)
    day           = Column(String(20), nullable=False)   # e.g. Monday
    start_time    = Column(String(10), nullable=False)   # e.g. 08:00
    end_time      = Column(String(10), nullable=False)   # e.g. 10:00