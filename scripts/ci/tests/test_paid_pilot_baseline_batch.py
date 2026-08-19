"""Batch tests: paid-pilot baseline readiness validation and proof wiring."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_paid_pilot_baseline_readiness.py"
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
KICKOFF_SCRIPT = REPO_ROOT / "scripts" / "validate-paid-pilot-baseline-readiness.ps1"
TEMPLATE = REPO_ROOT / "docs" / "go-to-market" / "templates" / "paid-pilot-baseline.template.json"


class PaidPilotBaselineBatchTests(unittest.TestCase):
    def test_proof_script_wires_baseline_readiness(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-PaidPilotBaselineReadinessFinding",
            "report_paid_pilot_baseline_readiness.py",
            "paid-pilot-baseline-readiness-report.json",
            "paid-pilot-baseline-readiness-report.md",
        ):
            self.assertIn(token, text)

        self.assertTrue(KICKOFF_SCRIPT.is_file())

    def test_strict_validation_passes_buyer_provided_baseline(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            baseline = root / "baseline.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "pilotLabel": "acme-paid-pilot",
                    "baselineReviewCycleHours": 18,
                    "baselineReviewCycleSource": "buyer-provided",
                    "baselineCapturedUtc": "2026-06-16T12:00:00Z",
                    "architectHourlyCost": 175,
                },
            )
            baseline.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            out_md = root / "report.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--baseline-json",
                    str(baseline),
                    "--json-out",
                    str(out_json),
                    "--markdown-out",
                    str(out_md),
                    "--strict-paid-pilot",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("PASS", report["disposition"])
            self.assertTrue(report["metrics"]["projectedDollarClaimsSponsorSafe"])

    def test_strict_validation_holds_without_baseline_or_waiver(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            baseline = root / "baseline.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "pilotLabel": "acme-paid-pilot",
                    "baselineReviewCycleHours": None,
                    "baselineReviewCycleSource": "not-collected",
                    "baselineCapturedUtc": "2026-06-16T12:00:00Z",
                },
            )
            baseline.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--baseline-json",
                    str(baseline),
                    "--json-out",
                    str(out_json),
                    "--strict-paid-pilot",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(1, completed.returncode, msg=completed.stdout)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("HOLD", report["disposition"])
            self.assertTrue(report["validationErrors"])

    def test_waiver_produces_warn_not_hold(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            baseline = root / "baseline.json"
            payload = json.loads(TEMPLATE.read_text(encoding="utf-8"))
            payload.update(
                {
                    "pilotLabel": "acme-paid-pilot",
                    "baselineReviewCycleHours": None,
                    "baselineReviewCycleSource": "",
                    "baselineCapturedUtc": "2026-06-16T12:00:00Z",
                    "waiver": {
                        "waived": True,
                        "rationale": "Buyer deferred baseline call to week two; sponsor readout stays qualitative.",
                        "approvedBy": "release owner",
                    },
                },
            )
            baseline.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
            out_json = root / "report.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--baseline-json",
                    str(baseline),
                    "--json-out",
                    str(out_json),
                    "--strict-paid-pilot",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            report = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("WARN", report["disposition"])


if __name__ == "__main__":
    unittest.main()
