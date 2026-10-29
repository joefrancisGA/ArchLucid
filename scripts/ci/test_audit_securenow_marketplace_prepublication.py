import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.audit_securenow_marketplace_prepublication import ROOT, audit

class MarketplaceProductIsolationTests(unittest.TestCase):
    def test_current_shared_marketplace_provider_does_not_authorize_secure_now(self):
        report = audit(ROOT)
        self.assertEqual("HOLD_NO_PUBLICATION", report["status"])
        self.assertFalse(report["marketplaceProductEnabled"])
        self.assertIn("webhookOfferIdCheckedBeforeMutation", report["blockers"])
        self.assertIn("crossProductEntitlementNegativeTestsObserved", report["blockers"])
        self.assertTrue(report["signals"]["globalOfferIdOptionExists"])

    def test_fake_owner_metadata_never_grants_security_entitlement(self):
        candidate={"productLine":"security", "offerId":"secure-offer", "archlucidOfferId":"architecture-offer",
                   "ownerApproved":True, "billingEnabled":False}
        report = audit(ROOT,candidate)
        self.assertEqual("HOLD_NO_PUBLICATION",report["status"])
        self.assertFalse(report["ownerApprovalVerified"])

    def test_shared_product_offer_collision_is_explicitly_blocked(self):
        report=audit(ROOT,{"productLine":"security","offerId":"same","archlucidOfferId":"same",
                            "billingEnabled":True})
        self.assertIn("CROSS_PRODUCT_OFFER_ID_COLLISION",report["blockers"])
        self.assertIn("LIVE_BILLING_ENABLED_WITHOUT_RELEASE_APPROVAL",report["blockers"])

    def test_unknown_product_and_missing_source_fail_honestly(self):
        with self.assertRaises(ValueError):
            audit(ROOT,{"productLine":"architecture"})
        with tempfile.TemporaryDirectory() as d:
            report=audit(Path(d))
            self.assertIn("REQUIRED_SOURCE_MISSING",report["blockers"])

if __name__=="__main__":
    unittest.main()
