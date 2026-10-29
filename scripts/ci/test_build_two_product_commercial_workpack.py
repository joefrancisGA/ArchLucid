import json
import tempfile
import unittest
from pathlib import Path
from scripts.ci.build_two_product_commercial_workpack import (
    ROOT, build, claims, competitive_evidence, economics, marketplace,
    pilot_proof, quote_followup, synthetic_demo, render_markdown,
)


class WorkpackTests(unittest.TestCase):
    def test_all_ten_lanes_have_no_commercial_approval(self):
        result = build(ROOT)
        self.assertEqual(10, len(result["lanes"]))
        self.assertEqual([f"{i:02d}" for i in range(1, 11)],
                         [row["priority"] for row in result["lanes"]])
        self.assertEqual("NO_GO", result["lanes"][0]["evidence"]["status"])
        self.assertEqual("HOLD_FOR_REAL_PILOT_AND_OWNER", result["lanes"][1]["evidence"]["status"])
        self.assertEqual("NO_MEASURED_COST_INPUT", result["lanes"][6]["evidence"]["status"])
        self.assertIn("NO_PUBLICATION", result["lanes"][8]["evidence"]["status"])
        self.assertIn("Engineering preparation", render_markdown(result))

    def test_synthetic_demo_explicitly_rejects_verified_claim(self):
        demo = synthetic_demo()
        self.assertEqual("SYNTHETIC_ILLUSTRATIVE_ONLY", demo["source"])
        self.assertEqual("NOT_VERIFIED", demo["verification"]["state"])
        self.assertFalse(demo["advisory"]["platformMutation"])
        self.assertTrue(demo["noCustomerEvidence"])

    def test_pilot_index_is_not_allowed_to_upgrade_official_gate(self):
        pilot = pilot_proof(ROOT, {"runs": [{
            "runId": "11111111-1111-1111-1111-111111111111", "testedSha": "a"*40,
            "committed": True, "realModeAttested": True, "proofPacketGenerated": True,
            "redactionReviewed": True, "ownerReviewed": True,
        }]})
        self.assertEqual(1, pilot["candidateCount"])
        self.assertEqual("HOLD_FOR_REAL_PILOT_AND_OWNER", pilot["status"])
        self.assertTrue(pilot["recordedGateHold"])

    def test_unit_cost_provenance_and_invalid_data(self):
        data = economics({"schema": "archlucid.unit-economics-input.v1", "entries": [
            {"product": "SecureNow", "totalCostUsd": 18, "units": 6, "basis": "MODELED"}]})
        self.assertEqual(3, data["entries"][0]["costPerUnitUsd"])
        self.assertIsNone(data["grossMargin"])
        with self.assertRaises(ValueError):
            economics({"schema": "archlucid.unit-economics-input.v1", "entries": [
                {"product": "SecureNow", "totalCostUsd": -1, "units": 6, "basis": "MODELED"}]})

    def test_quote_aggregation_does_not_echo_identity_fields(self):
        report = quote_followup(ROOT, {"schemaVersion": 1, "requestCount": 7,
            "weeklyDisposition": "WARN", "rows": [{"workEmail": "secret@example.test"}]})
        self.assertEqual(7, report["requestCount"])
        self.assertFalse(report["containsCustomerIdentifiers"])
        self.assertNotIn("secret@example.test", json.dumps(report))
        with self.assertRaises(ValueError):
            quote_followup(ROOT, {"requestCount": -1, "weeklyDisposition": "PASS"})

    def test_marketplace_stays_disabled_and_no_winner_is_claimed(self):
        m = marketplace(ROOT)
        self.assertFalse(m["betaGo"])
        self.assertTrue(m["noProductionMarketplaceWrite"])
        self.assertIsNone(competitive_evidence(ROOT)["archlucid"]["winner"])

    def test_claim_scanner_detects_unsupported_claim_without_leaking_body(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root / "docs/go-to-market").mkdir(parents=True)
            (root / "docs/securenow").mkdir(parents=True)
            (root / "docs/go-to-market/POSITIONING.md").write_text(
                "We guarantee ROI for all customers.\nDo not say guaranteed breach prevention.")
            for path in ["docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
                         "docs/securenow/BUYER_PROOF_DEMO.md",
                         "docs/securenow/CONTROLLED_PILOT_OFFER.md"]:
                (root/path).write_text("Evidence must be reviewed.")
            scan = claims(root)
            self.assertEqual("REVIEW_NEEDED", scan["status"])
            self.assertEqual(1, len(scan["findings"]))
            self.assertNotIn("We guarantee", json.dumps(scan))

if __name__=="__main__":
    unittest.main()
