from sqlalchemy.orm import Session
from models import ScheduledClass, Room, Instructor, Course
import random

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIME_SLOTS = [
    ("08:00", "10:00"),
    ("10:00", "12:00"),
    ("12:00", "14:00"),
    ("14:00", "16:00"),
]


def get_all_slots():
    """Return all possible (day, start, end) combinations."""
    slots = []
    for day in DAYS:
        for start, end in TIME_SLOTS:
            slots.append((day, start, end))
    return slots


def is_conflict(assignment, course_id, room_id, instructor_id, day, start, end):
    """
    Check if placing this class causes any constraint violation.
    Constraints:
    - Room not already used at this day/time
    - Instructor not already teaching at this day/time
    - Same course not already scheduled on this day
    """
    for entry in assignment:
        same_slot = (entry["day"] == day and
                     entry["start_time"] == start and
                     entry["end_time"] == end)

        # Room conflict
        if same_slot and entry["room_id"] == room_id:
            return True, "room"

        # Instructor conflict
        if same_slot and entry["instructor_id"] == instructor_id:
            return True, "instructor"

        # Same course twice on same day
        if entry["course_id"] == course_id and entry["day"] == day:
            return True, "duplicate_day"

    return False, None


def room_fits_course(room, course):
    """Room capacity must be adequate for the course duration."""
    return room.capacity >= 10


def backtrack(courses, rooms, instructors, assignment, index):
    """
    Recursive backtracking algorithm.
    Tries to assign a valid slot to each course one by one.
    Returns the complete assignment or None if no solution exists.
    """
    if index == len(courses):
        return assignment  # All courses successfully assigned

    course = courses[index]
    slots = get_all_slots()
    random.shuffle(slots)  # Shuffle for variety each time

    for day, start, end in slots:
        for room in rooms:
            if not room_fits_course(room, course):
                continue
            for instructor in instructors:
                conflict, reason = is_conflict(
                    assignment, course.id,
                    room.id, instructor.id,
                    day, start, end
                )
                if not conflict:
                    # Place this assignment
                    assignment.append({
                        "course_id": course.id,
                        "course_name": course.name,
                        "room_id": room.id,
                        "instructor_id": instructor.id,
                        "day": day,
                        "start_time": start,
                        "end_time": end,
                    })

                    # Recurse to next course
                    result = backtrack(
                        courses, rooms, instructors,
                        assignment, index + 1
                    )

                    if result is not None:
                        return result  # Solution found

                    # Backtrack — remove last assignment and try next
                    assignment.pop()

    return None  # No valid assignment found for this course


def generate_timetable(db: Session):
    """
    Main entry point.
    Clears existing timetable and generates a new conflict-free one.
    Returns (success, message, assignments).
    """
    courses = db.query(Course).all()
    rooms = db.query(Room).all()
    instructors = db.query(Instructor).all()

    if not courses:
        return False, "No courses found. Add courses first.", []
    if not rooms:
        return False, "No rooms found. Add rooms first.", []
    if not instructors:
        return False, "No instructors found. Add instructors first.", []

    # Check if enough slots exist
    total_slots = len(DAYS) * len(TIME_SLOTS) * len(rooms)
    if len(courses) > total_slots:
        return False, f"Not enough slots for {len(courses)} courses. Add more rooms or reduce courses.", []

    # Run the backtracking algorithm
    result = backtrack(courses, rooms, instructors, [], 0)

    if result is None:
        return False, "Could not generate a conflict-free timetable. Try adding more rooms, instructors or time slots.", []

    # Clear existing timetable
    db.query(ScheduledClass).delete()
    db.commit()

    # Save new timetable to database
    saved = []
    for entry in result:
        obj = ScheduledClass(
            course=entry["course_name"],
            room_id=entry["room_id"],
            instructor_id=entry["instructor_id"],
            day=entry["day"],
            start_time=entry["start_time"],
            end_time=entry["end_time"],
        )
        db.add(obj)
        saved.append(entry)

    db.commit()
    return True, f"Successfully generated timetable for {len(saved)} courses.", saved