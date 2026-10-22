"""Camera-independent table state machine. No video or biometric data stored."""
from dataclasses import dataclass
from uuid import uuid4

@dataclass
class TableState:
    table_id: str
    state: str = 'FREE'
    occupied_at: float | None = None
    missing_since: float | None = None
    present_since: float | None = None
    staff_since: float | None = None
    alerted: bool = False
    last_count: int = 0

    def update(self, people: int, staff_present: bool, now: float,
               occupied_hold=3.0, empty_hold=15.0, service_hold=4.0, wait_limit=300):
        events = []
        def emit(kind):
            events.append({'id': str(uuid4()), 'tableId': self.table_id,
                           'type': kind, 'people': people,
                           'occurredAt': int(now * 1000), 'source': 'edge'})
        if people:
            self.missing_since = None
            if self.present_since is None:
                self.present_since = now
            if self.state == 'FREE' and now - self.present_since >= occupied_hold:
                self.state, self.occupied_at = 'WAITING', now
                self.alerted = False
                emit('occupied')
            elif self.state in ('WAITING', 'SERVED') and people != self.last_count:
                emit('heartbeat')
        else:
            self.present_since = None
            self.staff_since = None
            if self.state in ('WAITING', 'SERVED'):
                if self.missing_since is None:
                    self.missing_since = now
                if now - self.missing_since >= empty_hold:
                    self.state = 'CLEANING'
                    emit('vacated')
        if staff_present and people and self.state == 'WAITING':
            if self.staff_since is None:
                self.staff_since = now
            if now - self.staff_since >= service_hold:
                self.state = 'SERVED'
                emit('served')
        else:
            self.staff_since = None
        self.last_count = people
        overdue = (self.state == 'WAITING' and self.occupied_at is not None
                   and now - self.occupied_at >= wait_limit and not self.alerted)
        if overdue:
            self.alerted = True
        return events, overdue

    def confirm_cleaned(self, now):
        if self.state != 'CLEANING':
            return None
        self.state, self.occupied_at, self.alerted = 'FREE', None, False
        self.present_since = self.missing_since = self.staff_since = None
        return {'id': str(uuid4()), 'tableId': self.table_id, 'type': 'cleaned',
                'people': 0, 'occurredAt': int(now * 1000), 'source': 'edge'}

def inside(point, polygon):
    """Ray casting on normalized coordinates; configure non-overlapping zones."""
    x, y = point
    result = False
    j = len(polygon) - 1
    for i, (xi, yi) in enumerate(polygon):
        xj, yj = polygon[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            result = not result
        j = i
    return result
