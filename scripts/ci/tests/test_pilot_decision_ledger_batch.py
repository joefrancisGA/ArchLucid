"""Batch tests: pilot decision-change ledger validation and proof wiring."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
REPORT_SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_pilot_decision_ledger.py"
AGGREGATE_SCRIPT = REPO_ROOT / "scripts" / "ci" / "aggregate_pilot_decision_ledgers.py"
TEMPLATE = REPO_ROOT / "docs/go-to-market/templates/pilot-decision-ledger.template.json"


class PilotDecisionLedgerBatchTests(unittest.TestCase):
    def test_proof_script_wires_decision_ledger(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-PilotDecisionLedgerFinding",
            "report_pilot_decision_ledger.py",
            "pilot-decision-ledger-report.json",
            "pilot-decision-ledger-report.md",
        ):
            self.assertIn(token, text)

    def test_strict_validation_passes_template(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            ledger = root / "ledger.json"
            ledger.write_text(TEMPLATE.read_text(encoding="utf-8"), encoding="utf-8")
            out_json = root / "report.json"
            out_md = root / "report.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--ledger-json",
                    str(ledger),
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
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("PASS", payload["disposition"])
            self.assertGreater(float(payload["decisionChangeRate"]), 0.0)

    def test_strict_validation_fails_without_attribution(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            ledger = root / "ledger.json"
            ledger.write_text(
                json.dumps(
                    {
                        "schema": "archlucid.pilot-decision-ledger.v1",
                        "pilotLabel": "test",
                        "runId": "run-1",
                        "paidPilot": True,
                        "decisionsUnderReview": [
                            {"decisionId": "d1", "title": "Approve design"},
                        ],
                        "decisionChanges": [],
                        "noDecisionChangesConfirmed": False,
                    },
                )
                + "\n",
                encoding="utf-8",
            )
            out_json = root / "report.json"
            out_md = root / "report.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPORT_SCRIPT),
                    "--ledger-json",
                    str(ledger),
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
            self.assertEqual(1, completed.returncode, msg=completed.stdout)
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("HOLD", payload["disposition"])
            self.assertTrue(payload["validationErrors"])

    def test_aggregate_script_runs_on_empty_root(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            out_json = root / "cohort.json"
            out_md = root / "cohort.md"
            completed = subprocess.run(
                [
                    "python",
                    str(AGGREGATE_SCRIPT),
                    "--ledgers-root",
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
            self.assertEqual(0, payload["ledgerCount"])


if __name__ == "__main__":
    unittest.main()
