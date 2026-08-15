"""Batch tests: pilot 30-day reuse cohort tracker and sponsor rollup."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_pilot_reuse_cohort_tracker.py"
AGGREGATE_SCRIPT = REPO_ROOT / "scripts" / "ci" / "aggregate_pilot_reuse_cohort_trackers.py"
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "pilot-reuse-cohort-tracker.template.json"


class PilotReuseCohortTrackerBatchTests(unittest.TestCase):
    def test_proof_script_wires_reuse_cohort_tracker(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-PilotReuseCohortTrackerFinding",
            "report_pilot_reuse_cohort_tracker.py",
            "pilot-reuse-cohort-tracker-report.json",
            "pilot-reuse-cohort-tracker-report.md",
        ):
            self.assertIn(token, text)

    def test_report_passes_complete_day30_tracking(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            tracker = root / "tracker.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "sessionId": "session-1",
                    "runId": "run-1",
                    "pilotLabel": "acme-pilot",
                    "pilotStartUtc": "2026-05-16T12:00:00Z",
                    "trackingComplete": True,
                    "followUp": {
                        "day7": {
                            "usageState": "returned-voluntarily",
                            "voluntaryReturnCount": 2,
                            "assistanceMode": "founder-assisted",
                            "continuationOrDropoffReason": "Returned to compare governance export against manual draft.",
                        },
                        "day14": {
                            "usageState": "continuing-voluntarily",
                            "voluntaryReturnCount": 4,
                            "assistanceMode": "mixed",
                            "continuationOrDropoffReason": "Used sponsor packet appendix in ARB prep.",
                        },
                        "day30": {
                            "usageState": "continuing-voluntarily",
                            "voluntaryReturnCount": 6,
                            "assistanceMode": "independent",
                            "continuationOrDropoffReason": "Independent second review without founder support.",
                        },
                    },
                },
            )
            tracker.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            out_md = root / "report.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--tracker-json",
                    str(tracker),
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
            self.assertIn("Follow-up checkpoints", out_md.read_text(encoding="utf-8"))

    def test_report_warns_when_tracking_incomplete(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            tracker = root / "tracker.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "sessionId": "session-2",
                    "pilotStartUtc": "2026-06-10T12:00:00Z",
                    "trackingComplete": False,
                },
            )
            tracker.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--tracker-json",
                    str(tracker),
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

    def test_cohort_rollup_surfaces_retention_metrics(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for index, assistance_mode in enumerate(("independent", "founder-assisted")):
                folder = root / f"pilot-{index}"
                folder.mkdir(parents=True, exist_ok=True)
                payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
                payload.update(
                    {
                        "sessionId": f"session-{index}",
                        "pilotStartUtc": "2026-05-01T12:00:00Z",
                        "trackingComplete": True,
                        "followUp": {
                            "day7": {
                                "usageState": "returned-voluntarily",
                                "voluntaryReturnCount": 1,
                                "assistanceMode": "founder-assisted",
                                "continuationOrDropoffReason": "Early return",
                            },
                            "day14": {
                                "usageState": "continuing-voluntarily",
                                "voluntaryReturnCount": 2,
                                "assistanceMode": assistance_mode,
                                "continuationOrDropoffReason": "Mid-pilot continuation",
                            },
                            "day30": {
                                "usageState": "continuing-voluntarily",
                                "voluntaryReturnCount": 3,
                                "assistanceMode": assistance_mode,
                                "continuationOrDropoffReason": "Still using for governance reviews",
                            },
                        },
                    },
                )
                (folder / "tracker.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

            out_json = root / "cohort.json"
            out_md = root / "cohort.md"
            completed = subprocess.run(
                [
                    "python",
                    str(AGGREGATE_SCRIPT),
                    "--trackers-root",
                    str(root),
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
            self.assertEqual(2, payload["pilotCount"])
            self.assertEqual(2, payload["day30ContinuingCount"])
            self.assertEqual(1.0, payload["day30RetentionRate"])
            self.assertIn("sponsor rollup", out_md.read_text(encoding="utf-8").lower())


if __name__ == "__main__":
    unittest.main()
