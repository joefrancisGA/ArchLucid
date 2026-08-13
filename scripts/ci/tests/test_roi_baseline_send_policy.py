"""Tests for ROI baseline SEND policy (Improvement 4)."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
CI = REPO_ROOT / "scripts" / "ci"


class RoiBaselineSendPolicyTests(unittest.TestCase):
    def test_complete_buyer_provided_is_send_eligible(self) -> None:
        sys.path.insert(0, str(CI))
        from roi_baseline_send_policy import evaluate_send_eligibility

        evaluation = evaluate_send_eligibility(
            {
                "blockCount": 0,
                "sponsorPacketDisposition": "READY",
                "roiBasisStatus": "buyer-provided",
                "roiSponsorSafe": True,
                "runId": "run-1",
            }
        )
        self.assertEqual("COMPLETE", evaluation["baselineCompletenessStatus"])
        self.assertTrue(evaluation["sendEligible"])

    def test_demo_derived_blocks_send_without_override(self) -> None:
        sys.path.insert(0, str(CI))
        from roi_baseline_send_policy import evaluate_send_eligibility

        evaluation = evaluate_send_eligibility(
            {
                "blockCount": 0,
                "sponsorPacketDisposition": "READY",
                "roiBasisStatus": "demo-derived",
                "roiSponsorSafe": False,
            }
        )
        self.assertEqual("NOT_COLLECTED", evaluation["baselineCompletenessStatus"])
        self.assertFalse(evaluation["sendEligible"])

    def test_override_allows_partial_send(self) -> None:
        sys.path.insert(0, str(CI))
        from roi_baseline_send_policy import evaluate_send_eligibility

        override = {
            "schema": "archlucid.roi-baseline-send-override.v1",
            "approvedByRole": "sponsor-owner",
            "recordedBy": "sales",
            "validForRunId": "run-1",
            "rationale": "Buyer will supply baselines next week; sponsor deck avoids dollar ROI.",
            "acceptedRisk": "No projected dollar claims in sponsor packet.",
        }
        evaluation = evaluate_send_eligibility(
            {
                "blockCount": 0,
                "sponsorPacketDisposition": "READY",
                "roiBasisStatus": "defaulted",
                "roiSponsorSafe": False,
                "runId": "run-1",
            },
            override,
        )
        self.assertTrue(evaluation["overrideApplied"])
        self.assertTrue(evaluation["sendEligible"])

    def test_quote_to_proof_strict_send_cli(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            summary = root / "summary.json"
            summary.write_text(
                json.dumps(
                    {
                        "blockCount": 0,
                        "sponsorPacketDisposition": "READY",
                        "roiBasisStatus": "not-collected",
                        "roiSponsorSafe": True,
                    }
                )
                + "\n",
                encoding="utf-8",
            )
            out_json = root / "readiness.json"
            out_md = root / "readiness.md"
            completed = subprocess.run(
                [
                    sys.executable,
                    str(CI / "report_quote_to_proof_readiness.py"),
                    "--go-no-go-summary",
                    str(summary),
                    "--json-out",
                    str(out_json),
                    "--markdown-out",
                    str(out_md),
                    "--strict-send",
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(1, completed.returncode, msg=completed.stderr)
            payload = json.loads(out_json.read_text(encoding="utf-8"))
            self.assertEqual("HOLD", payload["proofDisposition"])
            self.assertEqual("NOT_COLLECTED", payload["baselineCompletenessStatus"])


if __name__ == "__main__":
    unittest.main()
