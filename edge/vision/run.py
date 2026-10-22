import argparse
import json
import os
import time
from pathlib import Path
from .state import TableState, inside
from .transport import Outbox
from .sources import resolve_source

def main():
    parser = argparse.ArgumentParser(description='Restaurant Vision Edge: local video -> operational events')
    parser.add_argument('--kind', choices=['mp4', 'rtsp', 'onvif'], default='mp4')
    parser.add_argument('--source', default=os.getenv('RTSP_URL', 'demo.mp4'))
    parser.add_argument('--zones', default='zones.example.json')
    parser.add_argument('--model', default='yolo11n.pt')
    parser.add_argument('--tracker', choices=['bytetrack.yaml', 'botsort.yaml'], default='bytetrack.yaml')
    parser.add_argument('--customer-class', type=int, default=0)
    parser.add_argument('--staff-class', type=int, default=None, help='Only with a custom trained model. Generic person model cannot distinguish staff.')
    parser.add_argument('--live', action='store_true', help='Send live RTSP/ONVIF events to a production unit')
    parser.add_argument('--show', action='store_true')
    args = parser.parse_args()
    if args.live and args.kind == 'mp4':
        parser.error('MP4 is always a labeled demo/dry-run; production requires live RTSP/ONVIF')
    if args.staff_class == args.customer_class:
        parser.error('Staff and customer classes must differ')
    if args.live and not (os.getenv('PLATFORM_URL') and os.getenv('EDGE_API_KEY')):
        parser.error('PLATFORM_URL and EDGE_API_KEY required for live mode')
    config = json.loads(Path(args.zones).read_text(encoding='utf-8-sig'))
    zones = config['zones']
    if not zones or any(len(z['polygon']) < 3 for z in zones):
        parser.error('Configure at least one polygon with 3 normalized points')
    import cv2
    from ultralytics import YOLO
    model = YOLO(args.model)
    states = {z['tableId']: TableState(z['tableId']) for z in zones}
    queue = Outbox() if args.live else None
    # Persist domain state so an Edge restart does not silently reset visits.
    state_file = Path('outbox/state.json')
    if args.live and state_file.exists():
        saved = json.loads(state_file.read_text())
        for key in states:
            if key in saved:
                states[key] = TableState(**saved[key])
    capture = cv2.VideoCapture(resolve_source(args.kind, args.source))
    if not capture.isOpened():
        raise RuntimeError('Cannot open source. Check local connection/credentials.')
    fps = capture.get(cv2.CAP_PROP_FPS) or 25
    start, frame_id, reconnects, last_dispatch = time.time(), 0, 0, 0
    while True:
        ok, frame = capture.read()
        if not ok:
            if args.kind == 'mp4':
                break
            capture.release()
            reconnects += 1
            if queue:
                queue.flush(os.environ['PLATFORM_URL'], os.environ['EDGE_API_KEY'])
            time.sleep(min(30, reconnects * 2))
            capture = cv2.VideoCapture(resolve_source(args.kind, args.source))
            continue
        reconnects = 0
        frame_id += 1
        # MP4 clock is source time. Dry-run can execute faster than playback.
        now = start + frame_id / fps if args.kind == 'mp4' else time.time()
        h, w = frame.shape[:2]
        results = model.track(frame, persist=True, tracker=args.tracker, verbose=False,
                              classes=[args.customer_class] + ([] if args.staff_class is None else [args.staff_class]))
        boxes = results[0].boxes
        people = {z['tableId']: set() for z in zones}
        staff = {z['tableId']: False for z in zones}
        if boxes is not None and boxes.id is not None:
            for xyxy, track_id, cls in zip(boxes.xyxy.cpu().tolist(), boxes.id.int().cpu().tolist(), boxes.cls.int().cpu().tolist()):
                x1, y1, x2, y2 = xyxy
                center = ((x1+x2)/2/w, (y1+y2)/2/h)
                for zone in zones:
                    if inside(center, zone['polygon']):
                        if args.staff_class is not None and cls == args.staff_class:
                            staff[zone['tableId']] = True
                        else:
                            people[zone['tableId']].add(track_id)
                        break
        for zone in zones:
            table_id = zone['tableId']
            events, overdue = states[table_id].update(len(people[table_id]), staff[table_id], now)
            for event in events:
                if not args.live:
                    event['source'] = 'demo'
                    print(json.dumps(event), flush=True)
                else:
                    queue.put(event)
            if overdue:
                print(json.dumps({'type': 'local_wait_alert', 'tableId': table_id, 'simulated': not args.live}), flush=True)
        if args.live:
            from dataclasses import asdict
            tmp = state_file.with_suffix('.tmp')
            tmp.write_text(json.dumps({k: asdict(v) for k, v in states.items()}))
            tmp.replace(state_file)
            if time.time() - last_dispatch > 5:
                queue.flush(os.environ['PLATFORM_URL'], os.environ['EDGE_API_KEY'])
                queue.synchronize(os.environ['PLATFORM_URL'], os.environ['EDGE_API_KEY'], states)
                last_dispatch = time.time()
        if args.show:
            cv2.imshow('Restaurant Vision - LOCAL ONLY', results[0].plot())
            if cv2.waitKey(1) & 0xff == ord('q'):
                break
    capture.release()
    if args.show:
        cv2.destroyAllWindows()
    if queue:
        queue.flush(os.environ['PLATFORM_URL'], os.environ['EDGE_API_KEY'])

if __name__ == '__main__':
    main()
