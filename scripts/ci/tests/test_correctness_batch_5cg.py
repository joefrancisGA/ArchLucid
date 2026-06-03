"""TB-255 / TB-256 correctness drift guards (Batch 5CG)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestCorrectnessBatch5CG(unittest.TestCase):
    def test_tb_255_overlap_density_threshold(self) -> None:
        checker = (
            REPO_ROOT / "ArchLucid.AgentRuntime" / "Evaluation" / "AgentResultEvidenceFaithfulnessChecker.cs"
        )
        options = REPO_ROOT / "ArchLucid.Core" / "Configuration" / "AgentFaithfulnessOptions.cs"
        checker_text = checker.read_text(encoding="utf-8")
        self.assertIn("MeetsOverlapThreshold", checker_text)
        self.assertIn("MinDistinctOverlapTokens", options.read_text(encoding="utf-8"))

    def test_tb_256_has_checkable_content(self) -> None:
        report = REPO_ROOT / "ArchLucid.Contracts" / "Agents" / "AgentResultEvidenceFaithfulnessReport.cs"
        evaluator = (
            REPO_ROOT / "ArchLucid.AgentRuntime" / "Evaluation" / "AgentOutputTraceQualityEvaluator.cs"
        )
        self.assertIn("HasCheckableContent", report.read_text(encoding="utf-8"))
        evaluator_text = evaluator.read_text(encoding="utf-8")
        self.assertIn("!report.HasCheckableContent", evaluator_text)


if __name__ == "__main__":
    unittest.main()
