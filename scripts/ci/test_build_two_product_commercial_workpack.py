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

    @staticmethod
    def cost_row(cohort, start="2026-10-01T00:00:00Z",
                 end="2026-10-02T00:00:00Z", kind="ANALYSIS_RUN",
                 product="SecureNow", basis="MODELED"):
        # Purely synthetic inputs; no invoices, real customers or ROI.
        return {"product": product, "basis": basis, "totalCostUsd": 24,
                "units": 6, "cohortId": cohort, "unitKind": kind,
                "periodStartUtc": start, "periodEndUtc": end}

    def test_legacy_cost_rate_is_untyped_and_never_certified_comparable(self):
        row = {"product": "ArchLucid", "basis": "MODELED",
               "totalCostUsd": 18, "units": 6}
        report = economics({"schema": "archlucid.unit-economics-input.v1",
                            "entries": [row]})
        self.assertEqual(3, report["entries"][0]["costPerUnitUsd"])
        self.assertEqual("UNSPECIFIED_UNIT_AND_PERIOD",
                         report["entries"][0]["comparability"])
        self.assertEqual(0, report["completeDescriptorCount"])
        self.assertFalse(report["crossEntryComparisonCertified"])
        self.assertIsNone(report["grossMargin"])

    def test_nonoverlapping_structured_cost_windows_remain_unattested(self):
        rows = [self.cost_row("candidate-A"),
                self.cost_row("candidate-B", start="2026-10-02T00:00:00Z",
                              end="2026-10-03T00:00:00Z")]
        report = economics({"schema": "archlucid.unit-economics-input.v1",
                            "entries": rows})
        self.assertEqual(2, report["completeDescriptorCount"])
        self.assertEqual(0, report["overlappingDescriptorCount"])
        self.assertTrue(all(r["metadataComplete"] for r in report["entries"]))
        self.assertTrue(all(r["comparability"] == "STRUCTURED_COHORT_UNVERIFIED"
                            for r in report["entries"]))
        self.assertFalse(report["crossEntryComparisonCertified"])
        self.assertNotIn("candidate-A", json.dumps(report))
        self.assertNotIn("candidate-B", json.dumps(report))

    def test_overlapping_same_product_denominator_and_basis_requires_review(self):
        rows = [self.cost_row("sample-A"),
                self.cost_row("sample-B", start="2026-10-01T12:00:00Z",
                              end="2026-10-03T00:00:00Z")]
        report = economics({"schema": "archlucid.unit-economics-input.v1",
                            "entries": rows})
        self.assertEqual(2, report["overlappingDescriptorCount"])
        self.assertTrue(all(r["overlapReviewRequired"] for r in report["entries"]))
        self.assertEqual("OVERLAPPING_PERIOD_REVIEW_REQUIRED",
                         report["entries"][0]["comparability"])
        self.assertIsNone(report["grossMargin"])

    def test_different_denominator_product_or_basis_is_not_false_duplicate(self):
        rows = [self.cost_row("run-A"),
                self.cost_row("snapshot-B", kind="EVIDENCE_SNAPSHOT"),
                self.cost_row("other-C", product="ArchLucid"),
                self.cost_row("metered-D", basis="METERED_UNRECONCILED")]
        report = economics({"schema": "archlucid.unit-economics-input.v1",
                            "entries": rows})
        self.assertEqual(0, report["overlappingDescriptorCount"])

    def test_duplicate_cohort_identifiers_are_rejected_without_echoing_them(self):
        rows = [self.cost_row("Sensitive-Cohort-42"),
                self.cost_row("sensitive-cohort-42")]
        with self.assertRaisesRegex(ValueError, "Duplicated") as caught:
            economics({"schema": "archlucid.unit-economics-input.v1",
                       "entries": rows})
        self.assertNotIn("Sensitive-Cohort-42", str(caught.exception))

    def test_partial_descriptor_and_unknown_unit_kind_fail_closed(self):
        row = self.cost_row("cohort-1")
        del row["periodEndUtc"]
        with self.assertRaisesRegex(ValueError, "Incomplete"):
            economics({"schema": "archlucid.unit-economics-input.v1",
                       "entries": [row]})
        row = self.cost_row("cohort-1", kind="CUSTOMER_EMAIL")
        with self.assertRaisesRegex(ValueError, "denominator"):
            economics({"schema": "archlucid.unit-economics-input.v1",
                       "entries": [row]})

    def test_invalid_or_non_utc_periods_and_reversed_windows_fail_closed(self):
        for start, end in [
            ("2026-10-01T00:00:00", "2026-10-02T00:00:00Z"),
            ("2026-10-01T00:00:00+00:00", "2026-10-02T00:00:00Z"),
            ("2026-02-30T00:00:00Z", "2026-10-02T00:00:00Z"),
            ("2026-10-02T00:00:00Z", "2026-10-02T00:00:00Z"),
            ("2026-10-03T00:00:00Z", "2026-10-02T00:00:00Z"),
        ]:
            with self.subTest(start=start, end=end):
                with self.assertRaises(ValueError):
                    economics({"schema": "archlucid.unit-economics-input.v1",
                               "entries": [self.cost_row("test", start=start, end=end)]})

    def test_cost_rows_still_reject_nonfinite_and_invalid_unit_counts(self):
        for cost, units in [(float("inf"), 10), (float("nan"), 10),
                            (-1, 10), (12, 0), (12, True), (12, 10**20)]:
            with self.subTest(cost=str(cost), units=str(units)):
                row = self.cost_row("test")
                row.update(totalCostUsd=cost, units=units)
                with self.assertRaises(ValueError):
                    economics({"schema": "archlucid.unit-economics-input.v1",
                               "entries": [row]})

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
                         "docs/securenow/BUYER_SECURITY_ONE_PAGER.md",
                         "docs/securenow/CONTROLLED_PILOT_OFFER.md"]:
                (root/path).write_text("Evidence must be reviewed.")
            scan = claims(root)
            self.assertEqual("REVIEW_NEEDED", scan["status"])
            self.assertEqual(1, len(scan["findings"]))
            self.assertNotIn("We guarantee", json.dumps(scan))

if __name__=="__main__":
    unittest.main()
