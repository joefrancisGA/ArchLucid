"""Batch 4C contract tests: quote-to-proof, closeout, tier fit, overclaim (TB-129–134)."""

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"


class CommercialCloseoutBatchTests(unittest.TestCase):
    def test_proof_script_wires_batch_4c(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-QuoteToProofReadinessFinding",
            "Add-CommercialCloseoutConsistencyFinding",
            "Add-TierFitValidationFinding",
            "quote-to-proof-readiness.json",
            "quote-aging-sla.json",
            "check_commercial_overclaim_guard.py",
        ):
            self.assertIn(token, text)

    def test_closeout_consistency_passes_aligned_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            summary = root / "go-no-go-summary.json"
            closeout = root / "commercial-closeout.json"
            summary.write_text(
                json.dumps(
                    {
                        "blockCount": 0,
                        "sponsorPacketDisposition": "READY",
                        "roiBasisStatus": "buyer-provided",
                        "roiSponsorSafe": True,
                    },
                )
                + "\n",
                encoding="utf-8",
            )
            closeout.write_text(
                json.dumps(
                    {
                        "commercialDisposition": "PASS",
                        "sponsorPacketDisposition": "READY",
                        "roiBasisStatus": "buyer-provided",
                        "roiSponsorSafe": True,
                    },
                )
                + "\n",
                encoding="utf-8",
            )
            completed = subprocess.run(
                [
                    "python",
                    str(REPO_ROOT / "scripts/ci/validate_commercial_closeout_consistency.py"),
                    "--go-no-go-summary",
                    str(summary),
                    "--commercial-closeout",
                    str(closeout),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)

    def test_quote_to_proof_readiness_send(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            summary = root / "summary.json"
            summary.write_text(
                json.dumps(
                    {
                        "blockCount": 0,
                        "sponsorPacketDisposition": "READY",
                        "roiBasisStatus": "buyer-provided",
                        "roiSponsorSafe": True,
                    },
                )
                + "\n",
                encoding="utf-8",
            )
            out_json = root / "readiness.json"
            out_md = root / "readiness.md"
            completed = subprocess.run(
                [
                    "python",
                    str(REPO_ROOT / "scripts/ci/report_quote_to_proof_readiness.py"),
                    "--go-no-go-summary",
                    str(summary),
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
            self.assertEqual("SEND", payload["proofDisposition"])

    def test_offer_pack_and_boundary_guide_exist(self) -> None:
        self.assertTrue(
            (REPO_ROOT / "docs/go-to-market/AI_CLOUD_ARCHITECTURE_READINESS_REVIEW_OFFER_PACK.md").is_file(),
        )
        self.assertTrue((REPO_ROOT / "docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md").is_file())


if __name__ == "__main__":
    unittest.main()
