"""Tests for build_decision_cycle_telemetry.py."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "build_decision_cycle_telemetry.py"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "decision-cycle-events.template.json"


class DecisionCycleTelemetryTests(unittest.TestCase):
    def test_template_builds_summary_with_medians(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out_json = root / "summary.json"
            completed = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    "--events-json",
                    str(TEMPLATE),
                    "--json-out",
                    str(out_json),
                    "--markdown-out",
                    str(root / "summary.md"),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)

            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("archlucid.decision-cycle-telemetry-summary.v1", payload["schema"])
            self.assertEqual(1, payload["accountCount"])
            self.assertIsNotNone(payload["cohortMediansHours"]["demoToPilot"])


if __name__ == "__main__":
    unittest.main()
