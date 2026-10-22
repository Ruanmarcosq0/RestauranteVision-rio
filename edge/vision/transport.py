"""Durable SQLite outbox; retries use the same UUID, API is idempotent."""
import json
import sqlite3
import time
from pathlib import Path

class Outbox:
    def __init__(self, path='outbox/events.db'):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(path)
        self.db.execute('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, payload TEXT, attempts INTEGER DEFAULT 0, next_try REAL DEFAULT 0)')

    def put(self, event):
        with self.db:
            self.db.execute('INSERT OR IGNORE INTO events(id,payload) VALUES (?,?)', (event['id'], json.dumps(event)))

    def pending(self):
        return self.db.execute('SELECT COUNT(*) FROM events').fetchone()[0]

    def synchronize(self, url, key, states):
        # Never replace local state while events are waiting for acknowledgment.
        if self.pending():
            return
        import requests
        from datetime import datetime
        try:
            r = requests.get(url.rstrip('/') + '/api/edge/state', headers={'Authorization': 'Bearer ' + key}, timeout=5)
            if not r.ok:
                return
            for row in r.json()['tables']:
                if row['id'] not in states:
                    continue
                table = states[row['id']]
                if table.state != row['state']:
                    table.state = row['state']
                    table.occupied_at = datetime.fromisoformat(row['occupiedAt'].replace('Z','+00:00')).timestamp() if row['occupiedAt'] else None
                    table.staff_since = table.missing_since = table.present_since = None
                    table.alerted = False
        except (requests.RequestException, ValueError, KeyError):
            return

    def flush(self, url, key):
        import requests
        rows = self.db.execute('SELECT id,payload,attempts FROM events WHERE next_try<=? ORDER BY rowid LIMIT 20', (time.time(),)).fetchall()
        for event_id, payload, attempts in rows:
            try:
                r = requests.post(url.rstrip('/') + '/api/events', data=payload,
                                  headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}, timeout=8)
                if r.ok:
                    with self.db:
                        self.db.execute('DELETE FROM events WHERE id=?', (event_id,))
                    continue
                # 4xx usually indicates config/data mismatch; retain without spamming.
                delay = 3600 if 400 <= r.status_code < 500 else min(300, 2 ** min(attempts, 8))
            except requests.RequestException:
                delay = min(300, 2 ** min(attempts, 8))
            with self.db:
                self.db.execute('UPDATE events SET attempts=attempts+1,next_try=? WHERE id=?', (time.time() + delay, event_id))
