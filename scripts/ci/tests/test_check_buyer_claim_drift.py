from __future__ import annotations

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


_REPO = Path(__file__).resolve().parents[3]
_CI = _REPO / "scripts" / "ci"


def _load_guard():
    script = _CI / "check_buyer_claim_drift.py"
    spec = importlib.util.spec_from_file_location("_check_buyer_claim_drift", script)

    if spec is None or spec.loader is None:
        raise RuntimeError("Cannot load buyer claim drift guard.")

    sys.path.insert(0, str(_CI))

    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)

    return mod


G = _load_guard()


class TestBuyerClaimDrift(unittest.TestCase):
    def test_safe_fixture_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text(
                    "SOC 2 Type II is not currently issued. Do not claim SOC 2 certified. Generic OIDC is supported when configured.\n",
                    encoding="utf-8",
                )

            self.assertEqual(G.buyer_claim_drift_violations(root), [])

    def test_generic_oidc_roadmap_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/PRICING_PHILOSOPHY.md"
            bad.write_text("Authentication: Entra ID + generic OIDC (roadmap)\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("generic OIDC" in violation for violation in violations))

    def test_issued_soc_report_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/TRUST_CENTER.md"
            bad.write_text("SOC 2 Type II report is available.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("SOC 2 CPA reports" in violation for violation in violations))

    def test_soc_2_certified_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/TRUST_CENTER.md"
            bad.write_text("ArchLucid is SOC 2 certified.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("SOC 2 certification" in violation for violation in violations))

    def test_third_party_pen_test_report_available_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/PROCUREMENT_FAQ.md"
            bad.write_text("The third-party pen-test report is available under NDA.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("penetration-test report availability" in violation for violation in violations))

    def test_mcp_ga_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/INTEGRATION_CATALOG.md"
            bad.write_text("MCP public plugin marketplace is GA for customers.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("MCP and public plugin ecosystem" in violation for violation in violations))

    def test_broad_real_llm_validation_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/AI_EVIDENCE_APPENDIX.md"
            bad.write_text("Full real-LLM validation is complete for the product.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("real-LLM proof" in violation for violation in violations))

    def test_marketplace_published_phrase_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/TRUST_CENTER.md"
            bad.write_text("Status: Marketplace Published for enterprise buyers.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("Marketplace Published" in violation for violation in violations))

    def test_jira_v1_ga_promise_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            bad = root / "docs/go-to-market/INTEGRATION_CATALOG.md"
            bad.write_text("First-party Jira is a V1 GA capability for all tenants.\n", encoding="utf-8")

            violations = G.buyer_claim_drift_violations(root)

            self.assertTrue(any("V1 GA capabilities" in violation for violation in violations))

    def test_allowlist_marker_skips_violation(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)

            for rel in G.DOCS_TO_SCAN:
                target = root / rel
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("Safe default text.\n", encoding="utf-8")

            allowed = root / "docs/go-to-market/SOC2_STATUS_PROCUREMENT.md"
            allowed.write_text(
                "SOC 2 Type II issued buyer-claim-drift: allow — fixture documents negative phrasing for reviewers.\n",
                encoding="utf-8",
            )

            self.assertEqual(G.buyer_claim_drift_violations(root), [])


if __name__ == "__main__":
    unittest.main()
