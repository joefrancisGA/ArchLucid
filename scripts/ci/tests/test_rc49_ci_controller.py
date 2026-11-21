"""Pure policy tests for RC49 CI controller."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("rc49_controller", Path(__file__).resolve().parents[1] / "rc49_ci_controller.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
decide = module.decide

class ControllerTests(unittest.TestCase):
    def test_waits_with_three_failures(self):
        runs = [{"id": 1, "status": "in_progress", "head_sha": "old"}]
        jobs = [{"id": i, "run_id": 1, "conclusion": "failure"} for i in range(3)]
        self.assertEqual("wait", decide(runs, jobs, "new", "new")["action"])

    def test_cancels_with_four_failures_and_ready_new_head(self):
        runs = [{"id": 1, "status": "in_progress", "head_sha": "old"}]
        jobs = [{"id": i, "run_id": 1, "conclusion": "failure"} for i in range(4)]
        self.assertEqual("cancel", decide(runs, jobs, "new", "new")["action"])

    def test_never_cancels_without_reviewed_new_head(self):
        runs = [{"id": 1, "status": "in_progress", "head_sha": "old"}]
        jobs = [{"id": i, "run_id": 1, "conclusion": "failure"} for i in range(5)]
        self.assertEqual("wait", decide(runs, jobs, "new", "")["action"])

    def test_never_dispatches_while_pending(self):
        self.assertEqual("wait", decide([{"id": 2, "status": "queued"}], [], "new", "new")["action"])

    def test_dispatches_new_reviewed_head_only(self):
        self.assertEqual("dispatch", decide([], [], "new", "new")["action"])
        self.assertEqual("wait", decide([{"id": 1, "status": "completed", "head_sha": "new", "conclusion": "failure"}], [], "new", "new")["action"])

if __name__ == "__main__":
    unittest.main()
