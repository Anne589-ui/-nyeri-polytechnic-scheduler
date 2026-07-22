from models import ScheduledClass
from schemas import Clash


def _to_minutes(t: str) -> int:
    h, m = map(int, t.split(":"))
    return h * 60 + m


def times_overlap(a_start, a_end, b_start, b_end) -> bool:
    return _to_minutes(a_start) < _to_minutes(b_end) and \
           _to_minutes(b_start) < _to_minutes(a_end)


def detect_clashes(classes: list) -> list:
    clashes = []
    for i in range(len(classes)):
        for j in range(i + 1, len(classes)):
            a, b = classes[i], classes[j]
            if a.day != b.day:
                continue
            if not times_overlap(a.start_time, a.end_time, b.start_time, b.end_time):
                continue

            if a.room_id == b.room_id:
                clashes.append(Clash(
                    type="room",
                    day=a.day,
                    start_time=a.start_time,
                    end_time=a.end_time,
                    detail=f'Room double-booked: "{a.course}" and "{b.course}"',
                    class_ids=[a.id, b.id],
                ))

            if a.instructor_id == b.instructor_id:
                clashes.append(Clash(
                    type="instructor",
                    day=a.day,
                    start_time=a.start_time,
                    end_time=a.end_time,
                    detail=f'Instructor scheduled twice: "{a.course}" and "{b.course}"',
                    class_ids=[a.id, b.id],
                ))
    return clashes