"""Batch 4B contract tests: governance/audit proof reporters and catalog (TB-121–128)."""

from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PROOF_SCRIPT = REPO_ROOT / "scripts" / "collect-first-pilot-proof.ps1"
CATALOG_SCRIPT = REPO_ROOT / "scripts" / "ci" / "check_audit_event_catalog.py"
TRIAGE_DOC = REPO_ROOT / "docs" / "runbooks" / "SUPPORT_AUDIT_TRIAGE_ONE_PAGER.md"


class CommercialAuditProofBatchTests(unittest.TestCase):
    def test_proof_script_wires_batch_4b_artifacts(self) -> None:
        text = PROOF_SCRIPT.read_text(encoding="utf-8-sig")

        for token in (
            "Add-GovernanceOutcomeSummaryFinding",
            "Add-PolicyPackFreshnessFinding",
            "Add-BuyerSafeAuditEvidenceSummaryFinding",
            "governance-outcome-summary.md",
            "policy-pack-freshness.md",
            "audit-evidence-summary.md",
            "report_first_pilot_governance_outcome.py",
            "report_buyer_safe_audit_evidence_summary.py",
        ):
            self.assertIn(token, text)

    def test_triage_one_pager_exists(self) -> None:
        self.assertTrue(TRIAGE_DOC.is_file())
        body = TRIAGE_DOC.read_text(encoding="utf-8")
        self.assertIn("correlationId", body)
        self.assertIn("Buyer-safe", body)

    def test_audit_catalog_loads(self) -> None:
        import importlib.util
        import subprocess

        spec = importlib.util.spec_from_file_location("check_audit_event_catalog", CATALOG_SCRIPT)
        assert spec and spec.loader

        completed = subprocess.run(
            ["python", str(CATALOG_SCRIPT)],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(0, completed.returncode, msg=completed.stderr)

    def test_policy_freshness_v2_schema(self) -> None:
        import subprocess
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "freshness.json"
            completed = subprocess.run(
                [
                    "python",
                    str(REPO_ROOT / "scripts" / "ci" / "report_policy_pack_freshness.py"),
                    "--json-out",
                    str(out),
                ],
                cwd=REPO_ROOT,
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual(0, completed.returncode, msg=completed.stderr)
            payload = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual("archlucid.policy-pack-freshness.v2", payload["schema"])
            self.assertGreaterEqual(payload["packCount"], 8)


if __name__ == "__main__":
    unittest.main()
