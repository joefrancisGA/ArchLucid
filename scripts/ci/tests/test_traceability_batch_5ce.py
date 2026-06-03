"""TB-056 traceability drift guards (Batch 5CE)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatch5CE(unittest.TestCase):
    def test_tb_056_partial_failure_surfacing(self) -> None:
        orchestrator = REPO_ROOT / "ArchLucid.Decisioning" / "Services" / "FindingsOrchestrator.cs"
        manifest_builder = (
            REPO_ROOT / "ArchLucid.Decisioning" / "Manifest" / "Builders" / "DefaultGoldenManifestBuilder.cs"
        )
        analyzer = (
            REPO_ROOT / "ArchLucid.Decisioning" / "Findings" / "ExplainabilityTraceCompletenessAnalyzer.cs"
        )
        instrumentation = REPO_ROOT / "ArchLucid.Core" / "Diagnostics" / "ArchLucidInstrumentation.cs"

        orchestrator_text = orchestrator.read_text(encoding="utf-8")
        self.assertIn("FindingEngineFailure", orchestrator_text)
        self.assertIn("RecordFindingsEnginePartialFailure", orchestrator_text)

        manifest_text = manifest_builder.read_text(encoding="utf-8")
        self.assertIn("EngineFailures", manifest_text)
        self.assertIn("enrichment was skipped", manifest_text)

        analyzer_text = analyzer.read_text(encoding="utf-8")
        self.assertIn("ListHasMeaningfulAlternativePaths", analyzer_text)
        self.assertIn("RuleBasedDeterministicSinglePathNote", analyzer_text)

        instrumentation_text = instrumentation.read_text(encoding="utf-8")
        self.assertIn("archlucid_findings_engine_partial_failure_total", instrumentation_text)


if __name__ == "__main__":
    unittest.main()
