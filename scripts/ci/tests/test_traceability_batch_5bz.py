"""TB-054 unified run decision explainability drift guards (Batch 5BZ)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatch5BZ(unittest.TestCase):
    def test_tb_054_dto_and_builder(self) -> None:
        dto = REPO_ROOT / "ArchLucid.Contracts" / "Runs" / "RunDecisionExplainabilityDto.cs"
        builder = REPO_ROOT / "ArchLucid.Application" / "Runs" / "RunDecisionExplainabilityBuilder.cs"
        self.assertIn("RunDecisionExplainabilityDto", dto.read_text(encoding="utf-8"))
        self.assertIn("RunDecisionExplainabilityBuilder", builder.read_text(encoding="utf-8"))

    def test_tb_054_operator_ui_section(self) -> None:
        path = REPO_ROOT / "archlucid-ui" / "src" / "components" / "runs" / "RunDecisionExplainabilitySection.tsx"
        text = path.read_text(encoding="utf-8")
        self.assertIn("Decision explainability", text)

    def test_tb_054_run_detail_wiring(self) -> None:
        page_view_path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "[reviewId]"
            / "_sections"
            / "RunDetailPageView.tsx"
        )
        deferred_path = (
            REPO_ROOT
            / "archlucid-ui"
            / "src"
            / "app"
            / "(operator)"
            / "architecture"
            / "reviews"
            / "[reviewId]"
            / "_sections"
            / "RunDetailExplanationDeferred.tsx"
        )
        page_view_text = page_view_path.read_text(encoding="utf-8")
        deferred_text = deferred_path.read_text(encoding="utf-8")
        self.assertIn("RunDetailExplanationDeferred", page_view_text)
        self.assertIn("resolveRunDecisionExplainabilityFromDetail", deferred_text)


if __name__ == "__main__":
    unittest.main()
