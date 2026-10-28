"""Batch 5A contract tests: pilot acceptance thresholds automation (TB-158)."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from ci_test_helpers import PYTHON

REPO_ROOT = Path(__file__).resolve().parents[3]
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"


class PilotAcceptanceBatchTests(unittest.TestCase):
    def test_proof_script_wires_tb_158(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-PilotAcceptanceThresholdFinding",
            "report_pilot_acceptance_thresholds.py",
            "pilot-acceptance-thresholds.json",
            "pilot-acceptance-thresholds.md",
        ):
            self.assertIn(token, text)

    def test_pilot_acceptance_pass_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            summary = root / "go-no-go-summary.json"
            quote = root / "quote-to-proof-readiness.json"
            first_value = root / "first-value-report.md"
            summary.write_text(
                json.dumps(
                    {
                        "blockCount": 0,
                        "sponsorPacketDisposition": "READY",
                        "roiBasisStatus": "buyer-provided",
                        "roiSponsorSafe": True,
                        "runId": "run-abc",
                    },
                )
                + "\n",
                encoding="utf-8",
            )
            quote.write_text(
                json.dumps({"proofDisposition": "SEND"}) + "\n",
                encoding="utf-8",
            )
            first_value.write_text(
                "# First value\n\nrunId: run-abc\ncommittedUtc: 2026-06-01T12:00:00Z\n",
                encoding="utf-8",
            )
            out_json = root / "acceptance.json"
            out_md = root / "acceptance.md"
            completed = subprocess.run(
                [
                    PYTHON,
                    str(REPO_ROOT / "scripts/ci/report_pilot_acceptance_thresholds.py"),
                    "--go-no-go-summary",
                    str(summary),
                    "--quote-to-proof-readiness",
                    str(quote),
                    "--first-value-report",
                    str(first_value),
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
            self.assertEqual("PASS", payload["pilotOutcome"])
            self.assertEqual("Strong", payload["proofQualityLevel"])

    def test_first_value_report_rejects_placeholder_missing_timestamp_and_mismatched_run(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            summary = root / "summary.json"
            report = root / "first-value.md"
            result = root / "result.json"
            markdown = root / "result.md"
            summary.write_text(json.dumps({
                "blockCount": 0, "sponsorPacketDisposition": "READY",
                "roiBasisStatus": "buyer-provided", "roiSponsorSafe": True,
                "runId": "run-abc",
            }), encoding="utf-8")

            invalid_reports = [
                "# First value\nrunId: run-abc\n",  # no committed timestamp
                "runId: pending\ncommittedUtc: 2026-06-01T12:00:00Z\n",
                "runId: run-other\ncommittedUtc: 2026-06-01T12:00:00Z\n",
                "runId: run-abc\ncommittedUtc: not-a-date\n",
                "runId: run-abc\ncommittedUtc: 2999-06-01T12:00:00Z\n",
                "runId: run-abc\ncommittedUtc: 2026-06-01T12:00:00\n",
                "# Mentions runId and committedUtc without evidence\n",
            ]
            for text in invalid_reports:
                with self.subTest(report=text):
                    report.write_text(text, encoding="utf-8")
                    finished = subprocess.run(
                        [PYTHON, str(REPO_ROOT / "scripts/ci/report_pilot_acceptance_thresholds.py"),
                         "--go-no-go-summary", str(summary),
                         "--first-value-report", str(report),
                         "--json-out", str(result), "--markdown-out", str(markdown)],
                        cwd=REPO_ROOT, capture_output=True, text=True, check=False,
                    )
                    self.assertEqual(finished.returncode, 0, finished.stderr)
                    payload = json.loads(result.read_text(encoding="utf-8"))
                    self.assertEqual(payload["pilotOutcome"], "HOLD")
                    first_value_gate = next(g for g in payload["gates"] if g["id"] == "first-value-report")
                    self.assertEqual(first_value_gate["status"], "HOLD")

    def test_threshold_matrix_and_canonical_doc_exist(self) -> None:
        matrix = REPO_ROOT / "scripts/ci/data/pilot_acceptance_thresholds.v1.json"
        doc = REPO_ROOT / "docs/go-to-market/PILOT_ACCEPTANCE_THRESHOLDS.md"
        self.assertTrue(matrix.is_file())
        self.assertTrue(doc.is_file())


if __name__ == "__main__":
    unittest.main()
