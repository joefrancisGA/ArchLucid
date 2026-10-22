"""Drift guard for mutating route idempotency posture."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DRIFT = REPO_ROOT / "scripts" / "ci" / "detect_mutating_route_idempotency_drift.py"
BASELINE = REPO_ROOT / "scripts" / "ci" / "fixtures" / "mutating_route_idempotency_baseline.json"


class TestMutatingRouteIdempotencyDrift(unittest.TestCase):
    def test_idempotency_drift_passes_against_committed_baseline(self) -> None:
        proc = subprocess.run(
            [sys.executable, str(DRIFT)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        self.assertEqual(0, proc.returncode, proc.stderr or proc.stdout)
        self.assertTrue(BASELINE.is_file())
        payload = json.loads(BASELINE.read_text(encoding="utf-8"))
        self.assertEqual("1.0", payload.get("formatVersion"))
        self.assertIsInstance(payload.get("routes"), dict)


if __name__ == "__main__":
    unittest.main()
