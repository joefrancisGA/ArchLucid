"""TB-024 LlmCostEstimator reasoning-token test coverage drift guards."""

from __future__ import annotations

import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]

REQUIRED_TEST_METHODS = (
    "EstimateUsd_applies_explicit_reasoning_rate_when_configured",
    "EstimateUsd_reasoning_falls_back_to_output_rate_when_zero",
    "EstimateUsd_per_deployment_reasoning_overrides_global",
    "EstimateUsd_reasoning_fallback_uses_persisted_override_output_rate",
    "EstimateUsd_reasoning_cost_records_matching_otel_counter",
)


class TestLlmCostEstimatorTb024(unittest.TestCase):
    def test_tb_024_reasoning_token_tests_present(self) -> None:
        path = REPO_ROOT / "ArchLucid.AgentRuntime.Tests" / "LlmCostEstimatorTests.cs"
        text = path.read_text(encoding="utf-8")

        for method_name in REQUIRED_TEST_METHODS:
            with self.subTest(method=method_name):
                self.assertIn(method_name, text)


if __name__ == "__main__":
    unittest.main()
