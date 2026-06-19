"""Batch tests: first non-obvious moment validation and proof wiring."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_first_non_obvious_moment.py"
AGGREGATE_SCRIPT = REPO_ROOT / "scripts" / "ci" / "aggregate_first_non_obvious_moments.py"
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "first-non-obvious-moment.template.json"


class FirstNonObviousMomentBatchTests(unittest.TestCase):
    def test_proof_script_wires_first_non_obvious_moment(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-FirstNonObviousMomentFinding",
            "report_first_non_obvious_moment.py",
            "first-non-obvious-moment-report.json",
            "first-non-obvious-moment-report.md",
        ):
            self.assertIn(token, text)

    def test_report_passes_confirmed_moment(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            moment = root / "moment.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "sessionId": "session-1",
                    "runId": "run-1",
                    "pilotLabel": "acme-pilot",
                    "sessionUtc": "2026-06-16T14:00:00Z",
                    "firstNonObviousMoment": {
                        "timestampUtc": "2026-06-16T14:22:00Z",
                        "findingId": "F-014",
                        "participantQuote": "I would not have connected the private endpoint gap to the approval gate.",
                        "correctnessConfidence": "high",
                        "changedPlannedAction": True,
                    },
                },
            )
            moment.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            out_md = root / "report.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--moment-json",
                    str(moment),
                    "--json-out",
                    str(out_json),
                    "--markdown-out",
                    str(out_md),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("PASS", report["disposition"])
            self.assertIn("First non-obvious moment", out_md.read_text(encoding="utf-8"))

    def test_report_warns_when_not_yet_observed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            moment = root / "moment.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "sessionId": "session-2",
                    "notYetObserved": True,
                    "notYetObservedRationale": "Participant saw useful findings but none were non-obvious versus their first pass.",
                    "baselineCapturedUtc": "2026-06-16T14:00:00Z",
                },
            )
            payload["firstNonObviousMoment"] = {
                "timestampUtc": "",
                "findingId": "",
                "participantQuote": "",
                "correctnessConfidence": "",
                "changedPlannedAction": False,
            }
            moment.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--moment-json",
                    str(moment),
                    "--json-out",
                    str(out_json),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("WARN", report["disposition"])
            self.assertFalse(report["metrics"]["observed"])

    def test_aggregate_runs_on_empty_root(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out_json = root / "cohort.json"
            completed = subprocess.run(
                [
                    "python",
                    str(AGGREGATE_SCRIPT),
                    "--moments-root",
                    str(root),
                    "--json-out",
                    str(out_json),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual(0, payload["sessionCount"])


if __name__ == "__main__":
    unittest.main()
