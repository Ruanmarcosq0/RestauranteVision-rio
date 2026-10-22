import unittest
from vision.state import TableState, inside

class StateTests(unittest.TestCase):
    def test_full_visit_and_alert_dedup(self):
        t = TableState('table-1')
        self.assertEqual(t.update(2, False, 0)[0], [])
        self.assertEqual(t.update(2, False, 3)[0][0]['type'], 'occupied')
        self.assertFalse(t.update(2, False, 302)[1])
        self.assertTrue(t.update(2, False, 303)[1])
        self.assertFalse(t.update(2, False, 304)[1])
        t.update(2, True, 305)
        self.assertEqual(t.update(2, True, 309)[0][0]['type'], 'served')
        t.update(0, False, 320)
        self.assertEqual(t.update(0, False, 335)[0][0]['type'], 'vacated')
        self.assertEqual(t.confirm_cleaned(340)['type'], 'cleaned')
        self.assertEqual(t.state, 'FREE')

    def test_occlusion_and_staff_passby(self):
        t = TableState('table-1')
        t.update(2, False, 0)
        t.update(2, False, 3)
        t.update(0, False, 4)
        t.update(2, True, 10)
        t.update(2, False, 12)
        self.assertEqual(t.state, 'WAITING')

    def test_polygon(self):
        poly = [(0,0),(1,0),(1,1),(0,1)]
        self.assertTrue(inside((.5,.5), poly))
        self.assertFalse(inside((2,.5), poly))

if __name__ == '__main__':
    unittest.main()
