"""TB-025 LlmCostUsdTotal pretax / double-cast annotation drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]


def _instrumentation_sources() -> str:
    diagnostics = REPO_ROOT / "ArchLucid.Core" / "Diagnostics"
    return "".join(
        path.read_text(encoding="utf-8")
        for path in sorted(diagnostics.glob("ArchLucidInstrumentation*.cs"))
    )


INSTRUMENTATION = REPO_ROOT / "ArchLucid.Core" / "Diagnostics" / "ArchLucidInstrumentation.cs"
OPTIONS = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "LlmCostEstimationOptions.cs"

COUNTER_DESCRIPTION_SNIPPETS = (
    "Pre-tax estimated LLM spend in USD",
    "Monitoring-grade only",
    "decimal-to-double cast",
    "Does not include VAT/GST",
)


class TestLlmCostEstimatorTb025(unittest.TestCase):
    def test_tb_025_counter_description_documents_pretax_and_double_cast(self) -> None:
        text = INSTRUMENTATION.read_text(encoding="utf-8")

        for snippet in COUNTER_DESCRIPTION_SNIPPETS:
            with self.subTest(snippet=snippet):
                self.assertIn(snippet, text)

    def test_tb_025_record_llm_cost_usd_comment_documents_monitoring_grade_cast(self) -> None:
        text = _instrumentation_sources()
        self.assertIn("Counter<double> requires double", text)
        self.assertIn("Acceptable for dashboards/alerts", text)

    def test_tb_025_llm_cost_estimation_options_documents_pretax(self) -> None:
        text = OPTIONS.read_text(encoding="utf-8")
        self.assertIn("pre-tax USD cost estimation", text)


if __name__ == "__main__":
    unittest.main()
