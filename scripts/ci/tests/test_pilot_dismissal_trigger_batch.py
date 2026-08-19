"""Batch tests: pilot dismissal-trigger capture and monthly aggregate."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_pilot_dismissal_trigger.py"
AGGREGATE_SCRIPT = REPO_ROOT / "scripts" / "ci" / "aggregate_pilot_dismissal_triggers.py"
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "pilot-dismissal-trigger.template.json"


class PilotDismissalTriggerBatchTests(unittest.TestCase):
    def test_proof_script_wires_dismissal_trigger(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-PilotDismissalTriggerFinding",
            "report_pilot_dismissal_trigger.py",
            "pilot-dismissal-trigger-report.json",
            "pilot-dismissal-trigger-report.md",
        ):
            self.assertIn(token, text)

    def test_report_passes_dismissal_capture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            capture = root / "dismissal.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "sessionId": "session-1",
                    "runId": "run-1",
                    "pilotLabel": "acme-pilot",
                    "sessionUtc": "2026-06-16T15:00:00Z",
                    "dismissalCapture": {
                        "primaryCategory": "equivalent-to-frontier-ai",
                        "evidenceSnippet": "Participant said they already get equivalent insights with GPT and internal rigor.",
                        "triggerTiming": "after-first-committed-run",
                        "mitigationAttempted": "Walked evidence trail and governance export path.",
                        "finalOutcome": "continued-evaluation",
                    },
                },
            )
            capture.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            out_md = root / "report.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--capture-json",
                    str(capture),
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
            self.assertIn("Dismissal trigger", out_md.read_text(encoding="utf-8"))

    def test_report_passes_no_dismissal_observed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            capture = root / "dismissal.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "sessionId": "session-2",
                    "sessionUtc": "2026-06-16T15:00:00Z",
                    "noDismissalObserved": True,
                },
            )
            capture.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--capture-json",
                    str(capture),
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
            self.assertEqual("PASS", report["disposition"])

    def test_monthly_aggregate_shows_top_triggers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for index, category in enumerate(("equivalent-to-frontier-ai", "equivalent-to-frontier-ai", "setup-or-ingest-friction")):
                folder = root / f"session-{index}"
                folder.mkdir(parents=True, exist_ok=True)
                payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
                payload.update(
                    {
                        "sessionId": f"session-{index}",
                        "sessionUtc": "2026-06-16T15:00:00Z",
                        "dismissalCapture": {
                            "primaryCategory": category,
                            "evidenceSnippet": "sample",
                            "triggerTiming": "before-first-committed-run",
                            "mitigationAttempted": "demo reset",
                            "finalOutcome": "dropped",
                        },
                    },
                )
                (folder / "dismissal.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            out_json = root / "monthly.json"
            out_md = root / "monthly.md"
            completed = subprocess.run(
                [
                    "python",
                    str(AGGREGATE_SCRIPT),
                    "--captures-root",
                    str(root),
                    "--month",
                    "2026-06",
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
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual(3, payload["sessionCount"])
            self.assertGreaterEqual(len(payload["topTriggers"]), 1)
            self.assertEqual("equivalent-to-frontier-ai", payload["topTriggers"][0]["primaryCategory"])
            self.assertIn("Trend", out_md.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
