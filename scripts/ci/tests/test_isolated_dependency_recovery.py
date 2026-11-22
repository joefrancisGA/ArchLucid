import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from isolated_dependency_recovery import run_experiment


class IsolatedRecoveryTests(unittest.TestCase):
    def test_outage_detected_and_recovery_measured(self):
        result = run_experiment(.05, .01, 1)
        self.assertEqual(result["status"], "pass")
        self.assertTrue(result["observedHttp503DuringOutage"])
        self.assertTrue(result["baselineHttp200"])
        self.assertIsNotNone(result["recoverySecondsObserved"])
        self.assertEqual(result["target"], "127.0.0.1:ephemeral")

    def test_unbounded_profile_rejected(self):
        for duration, interval, deadline in ((6, .01, 1), (.1, 0, 1), (.1, .01, 11)):
            with self.assertRaises(ValueError):
                run_experiment(duration, interval, deadline)


if __name__ == "__main__":
    unittest.main()
