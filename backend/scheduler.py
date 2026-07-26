from itertools import product
import random

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIME_SLOTS = [
    ("08:00", "10:00"),
    ("10:00", "12:00"),
    ("12:00", "14:00"),
    ("14:00", "16:00"),
]


def _to_minutes(t: str) -> int:
    h, m = map(int, t.split(":"))
    return h * 60 + m


def times_overlap(a_start, a_end, b_start, b_end) -> bool:
    return _to_minutes(a_start) < _to_minutes(b_end) and \
           _to_minutes(b_start) < _to_minutes(a_end)


def _is_slot_free(assignments, room_id, instructor_id, day, start, end, course):
    for a in assignments:
        same_time = a["day"] == day and times_overlap(
            a["start_time"], a["end_time"], start, end
        )
        if same_time and a["room_id"] == room_id:
            return False
        if same_time and a["instructor_id"] == instructor_id:
            return False
        if a["day"] == day and a["course"] == course:
            return False
    return True


def generate_timetable(courses, rooms, instructors):
    if not courses or not rooms or not instructors:
        return {
            "scheduled": [],
            "unscheduled": [],
            "stats": {"total": 0, "scheduled": 0, "unscheduled": 0}
        }

    assignments = []
    unscheduled = []

    # Build all possible slots and shuffle for even distribution
    all_slots = list(product(DAYS, TIME_SLOTS, rooms))

    for idx, course in enumerate(courses):
        instructor = instructors[idx % len(instructors)]
        placed = False

        # Shuffle slots so classes spread across all days
        shuffled_slots = all_slots.copy()
        random.shuffle(shuffled_slots)

        # Sort by day index to prefer spreading across days
        # but still randomize within each day
        day_order = {day: i for i, day in enumerate(DAYS)}

        # Count how many classes are already on each day
        day_counts = {day: 0 for day in DAYS}
        for a in assignments:
            day_counts[a["day"]] += 1

        # Sort slots preferring days with fewer classes
        shuffled_slots.sort(key=lambda s: day_counts[s[0]])

        for day, (start, end), room in shuffled_slots:
            if _is_slot_free(assignments, room.id, instructor.id,
                             day, start, end, course.name):
                assignments.append({
                    "course": course.name,
                    "room_id": room.id,
                    "instructor_id": instructor.id,
                    "day": day,
                    "start_time": start,
                    "end_time": end,
                })
                placed = True
                break

        if not placed:
            unscheduled.append({
                "course": course.name,
                "reason": f"No available slot found for {course.name}"
            })

    # Sort final assignments by day then time
    day_order = {day: i for i, day in enumerate(DAYS)}
    assignments.sort(key=lambda a: (day_order[a["day"]], a["start_time"]))

    return {
        "scheduled": assignments,
        "unscheduled": unscheduled,
        "stats": {
            "total": len(courses),
            "scheduled": len(assignments),
            "unscheduled": len(unscheduled),
        }
    }