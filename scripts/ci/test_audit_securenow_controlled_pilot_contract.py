"""Regression tests for GTM-05's read-only owner-gated pilot offer contract."""
import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.audit_securenow_controlled_pilot_contract import (
    ROOT, OFFER, MATRIX, SOURCES, audit,
)


class PilotContractAuditTests(unittest.TestCase):
    def fixture(self, tmp: str) -> Path:
        dest = Path(tmp)
        for rel in SOURCES:
            output = dest / rel
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes((ROOT / rel).read_bytes())
        return dest

    def modify(self, root: Path, rel: str, before: str, after: str) -> None:
        path = root / rel
        original = path.read_text()
        self.assertIn(before, original)
        path.write_text(original.replace(before, after, 1))

    def test_current_canonical_sources_stay_unapproved(self):
        r = audit(ROOT)
        self.assertTrue(r["draftContractIntact"], r["blockingDriftCodes"])
        self.assertEqual("HOLD_OWNER_APPROVAL_REQUIRED", r["status"])
        self.assertEqual(22, r["betaMatrixRows"])
        for key in ("offerApproved", "betaGo", "publicationAllowed", "customerOutcomeObserved"):
            self.assertFalse(r[key])

    def test_checking_off_owner_task_cannot_autocertify(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            self.modify(root, OFFER, "- [ ] Pilot sponsor", "- [x] Pilot sponsor")
            r = audit(root)
            self.assertIn("OWNER_CHECKLIST_NOT_ALL_OPEN", r["blockingDriftCodes"])
            self.assertFalse(r["offerApproved"])

    def test_missing_milestone_or_verification_is_detected(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            self.modify(root, OFFER, "| 5. Verification", "| 8. Verification")
            self.assertIn("MILESTONE_SEQUENCE_CHANGED", audit(root)["blockingDriftCodes"])
            self.assertIn("CHANGE_OR_VERIFICATION_GUARD_MISSING", audit(root)["blockingDriftCodes"])

    def test_unpriced_terms_cannot_silently_become_priced(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            self.modify(root, OFFER, "**TO BE NEGOTIATED**", "**$15000**")
            self.assertIn("TERMS_NOT_EXPLICITLY_UNPRICED", audit(root)["blockingDriftCodes"])

    def test_release_disclaimer_missing_is_blocking(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            self.modify(root, OFFER, "SecureNow beta release remains **NO_GO**", "SecureNow beta release remains **GO**")
            self.assertIn("BETA_HOLD_MISSING", audit(root)["blockingDriftCodes"])
            self.assertFalse(audit(root)["betaGo"])

    def test_bad_matrix_or_duplicate_ids_cannot_claim_ready(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            path = root / MATRIX
            obj = json.loads(path.read_text())
            obj["requirements"][1]["id"] = obj["requirements"][0]["id"]
            path.write_text(json.dumps(obj))
            r = audit(root)
            self.assertIn("BETA_MATRIX_SHAPE_CHANGED", r["blockingDriftCodes"])
            self.assertIsNone(r["betaMatrixRows"])

    def test_missing_or_symlinked_sources_fail_closed(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            path = root / "docs/securenow/BUYER_PROOF_DEMO.md"
            path.unlink()
            path.symlink_to(root / OFFER)
            self.assertIn("SOURCE_MISSING_OR_UNSAFE", audit(root)["blockingDriftCodes"])

    def test_report_never_echoes_buyer_material(self):
        with tempfile.TemporaryDirectory() as t:
            root = self.fixture(t)
            self.modify(root, OFFER, "## Qualification and suitability", "secret@example.test\n## Qualification and suitability")
            self.assertNotIn("secret@example.test", json.dumps(audit(root)))


if __name__ == "__main__":
    unittest.main()
