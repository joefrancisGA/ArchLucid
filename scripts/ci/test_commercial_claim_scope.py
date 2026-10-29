"""GTM-10 regression: a disclaimer must not hide another buyer promise."""
import json
import tempfile
import unittest
from pathlib import Path

from scripts.ci.build_two_product_commercial_workpack import ROOT, claims

SOURCES = (
    "docs/go-to-market/POSITIONING.md",
    "docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md",
    "docs/securenow/BUYER_PROOF_DEMO.md",
    "docs/securenow/CONTROLLED_PILOT_OFFER.md",
)


def scan_copy(copy: str) -> dict:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        for name in SOURCES:
            path = root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("No measured customer results are claimed.\n", encoding="utf-8")
        (root / SOURCES[0]).write_text(copy, encoding="utf-8")
        return claims(root)


class ScopedCommercialClaimTests(unittest.TestCase):
    def test_current_canonical_sources_are_clear_but_not_approved_for_publication(self):
        report = claims(ROOT)
        self.assertEqual("STATIC_GUARD_CLEAR_NOT_MARKET_VALIDATED", report["status"])
        self.assertEqual([], report["findings"])
        self.assertEqual([], report["missingSources"])

    def test_denial_does_not_mask_promises_after_semicolon_or_full_stop(self):
        report = scan_copy(
            "Do not say guaranteed ROI; our platform guarantees savings.\n"
            "Never promise SOC 2 certified. SecureNow autonomously fixes systems.\n"
        )
        self.assertEqual(
            ["guaranteed_outcome", "autonomous_remediation"],
            [x["risk"] for x in report["findings"]],
        )
        self.assertEqual([1, 2], [x["line"] for x in report["findings"]])

    def test_comma_led_and_contrastive_assertions_are_scanned_independently(self):
        report = scan_copy(
            "No measured baseline, we guarantee ROI.\n"
            "Do not claim guaranteed savings, but we automatically apply the fix.\n"
            "No SOC assurance; however ArchLucid is SOC 2 certified.\n"
        )
        self.assertEqual(
            ["guaranteed_outcome", "autonomous_remediation", "unsupported_certification"],
            [x["risk"] for x in report["findings"]],
        )

    def test_negative_examples_and_buyer_questions_remain_unflagged(self):
        report = scan_copy(
            "Do not say guaranteed breach prevention.\n"
            "We don't guarantee ROI.\n"
            "A request for guaranteed breach prevention, numeric likelihood, or "
            "assured savings is not an acceptable success criterion.\n"
            "- **No blanket warranty:** no autonomous remediation, or guaranteed ROI.\n"
            "| “Is it compliant / SOC 2 certified?” | No. Do not imply certification. |\n"
        )
        self.assertEqual("STATIC_GUARD_CLEAR_NOT_MARKET_VALIDATED", report["status"])
        self.assertFalse(report["findings"])

    def test_later_disclaimer_does_not_retroactively_suppress_promise(self):
        report = scan_copy(
            "We guarantee ROI without an observed baseline.\n"
            "Proven customer savings are not independently verified.\n"
        )
        self.assertEqual(
            ["guaranteed_outcome", "proven_customer_roi"],
            [x["risk"] for x in report["findings"]],
        )

    def test_report_contains_only_risk_codes_and_file_locations(self):
        secret = "hidden-buyer-legal-name"
        report = scan_copy(f"We guarantee ROI for {secret}.\n")
        self.assertEqual("REVIEW_NEEDED", report["status"])
        self.assertEqual(1, len(report["findings"]))
        self.assertNotIn(secret, json.dumps(report))
        self.assertEqual(
            {"product", "source", "line", "risk"}, set(report["findings"][0])
        )

    def test_unreadable_or_untrusted_sources_cannot_be_reported_as_clear(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in SOURCES[1:]:
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("Ready for review.\n", encoding="utf-8")
            self.assertIn(SOURCES[0], claims(root)["missingSources"])
            missing_source = root / SOURCES[0]
            missing_source.parent.mkdir(parents=True, exist_ok=True)
            missing_source.symlink_to(root / SOURCES[1])
            report = claims(root)
            self.assertIn(SOURCES[0], report["missingSources"])
            self.assertEqual("REVIEW_NEEDED", report["status"])


if __name__ == "__main__":
    unittest.main()
