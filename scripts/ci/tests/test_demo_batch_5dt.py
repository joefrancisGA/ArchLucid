"""Drift guards for batch 5DT-demo-revalidate-p0 (TB-275 / BDA residuals)."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


class TestDemoBatch5Dt(unittest.TestCase):
    def test_audit_completion_card_uses_buyer_polish_copy(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(operator)" / "governance" / "audit" / "_sections" / "AuditResultsSection.tsx"
        text = path.read_text(encoding="utf-8")

        self.assertIn("BUYER_AUDIT_TRAIL_COMPLETE_HEADING", text)
        self.assertIn("BUYER_AUDIT_PACKAGE_READY_LEAD", text)
        self.assertNotIn("Audit trail complete — review package finalized", text)

    def test_review_detail_finalize_anchor_targets_header(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "first-week-route-guidance.ts"
        text = path.read_text(encoding="utf-8")

        self.assertIn('href: BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR', text)
        self.assertNotIn('href: "#run-actions"', text)

    def test_cost_evidence_never_labels_demo_derived_display(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "sponsor" / "sponsor-roi-kpi-display.ts"
        text = path.read_text(encoding="utf-8")

        self.assertIn('display: "Illustrative"', text)
        self.assertNotIn('display: "Demo-derived"', text)

    def test_curated_audit_demo_requires_explicit_demo_build(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "demo-audit-sample-events.ts"
        text = path.read_text(encoding="utf-8")

        self.assertIn("isExplicitStaticDemoMarketingBuild()", text)


if __name__ == "__main__":
    unittest.main()
