"""TB-264 / TB-265 / TB-266 differentiability drift guards (Batch 5CN)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestDifferentiabilityBatch5CN(unittest.TestCase):
    def test_tb_264_competitor_citation_guard(self) -> None:
        script = REPO_ROOT / "scripts" / "ci" / "assert_why_rows_have_evidence.py"
        self.assertIn("_QUANTIFIED_COMPETITOR_RE", script.read_text(encoding="utf-8"))

    def test_tb_265_generic_ai_contrast_on_why(self) -> None:
        view = REPO_ROOT / "archlucid-ui" / "src" / "app" / "(marketing)" / "why" / "WhyArchlucidMarketingView.tsx"
        faq = REPO_ROOT / "archlucid-ui" / "src" / "lib" / "marketing-faq.ts"
        self.assertIn("why-vs-chat-assistant", view.read_text(encoding="utf-8"))
        self.assertIn("vs-chatgpt-copilot", faq.read_text(encoding="utf-8"))

    def test_tb_266_cohort_claim_lock_script(self) -> None:
        script = REPO_ROOT / "scripts" / "ci" / "assert_why_cohort_claim_locked.py"
        self.assertTrue(script.is_file())


if __name__ == "__main__":
    unittest.main()
