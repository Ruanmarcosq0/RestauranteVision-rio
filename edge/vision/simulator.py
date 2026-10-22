"""No external dependencies. Produces explicitly simulated event stream."""
import json
from .state import TableState

def main():
    table = TableState('table-1')
    for now, people, staff in [(0, 3, False), (3, 3, False), (304, 3, False), (305, 3, True), (310, 3, True), (320, 0, False), (336, 0, False)]:
        events, overdue = table.update(people, staff, now)
        for e in events:
            e['source'] = 'demo'
            print(json.dumps(e))
        if overdue:
            print(json.dumps({'type': 'wait_alert', 'tableId': table.table_id, 'simulated': True}))
    event = table.confirm_cleaned(350)
    event['source'] = 'demo'
    print(json.dumps(event))

if __name__ == '__main__':
    main()
