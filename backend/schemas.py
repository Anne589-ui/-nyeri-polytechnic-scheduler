from pydantic import BaseModel, ConfigDict
from typing import List, Optional


# ── Auth ──────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: str

class UserCreate(BaseModel):
    username: str
    full_name: str
    role: str
    password: str


# ── Courses ───────────────────────────────────────────────────────────
class CourseBase(BaseModel):
    name: str
    duration_hrs: Optional[int] = 2

class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    duration_hrs: Optional[int] = 2


# ── Rooms ─────────────────────────────────────────────────────────────
class RoomBase(BaseModel):
    name: str
    capacity: int

class RoomOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    capacity: int


# ── Instructors ───────────────────────────────────────────────────────
class InstructorBase(BaseModel):
    name: str

class InstructorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


# ── Scheduled Classes ─────────────────────────────────────────────────
class ClassIn(BaseModel):
    course: str
    room_id: int
    instructor_id: int
    day: str
    start_time: str
    end_time: str

class ClassOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course: str
    room_id: int
    instructor_id: int
    day: str
    start_time: str
    end_time: str


# ── Clashes ───────────────────────────────────────────────────────────
class Clash(BaseModel):
    type: str
    day: str
    start_time: str
    end_time: str
    detail: str
    class_ids: List[int]