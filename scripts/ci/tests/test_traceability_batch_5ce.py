"""TB-056 traceability drift guards (Batch 5CE)."""

from __future__ import annotations

import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


class TestTraceabilityBatch5CE(unittest.TestCase):
    def test_tb_056_partial_failure_surfacing(self) -> None:
        findings_stages_dir = REPO_ROOT / "ArchLucid.Decisioning" / "Services" / "Findings"
        snapshot_emit_stage = findings_stages_dir / "FindingsSnapshotEmitStage.cs"
        manifest_builders_dir = (
            REPO_ROOT / "ArchLucid.Decisioning" / "Manifest" / "Builders"
        )
        provenance_populator = manifest_builders_dir / "ProvenanceManifestSectionPopulator.cs"
        requirements_populator = manifest_builders_dir / "RequirementsManifestSectionPopulator.cs"
        analyzer_dir = REPO_ROOT / "ArchLucid.Decisioning" / "Findings"
        instrumentation_root = REPO_ROOT / "ArchLucid.Core" / "Diagnostics" / "ArchLucidInstrumentation.cs"
        instrumentation_runs = (
            REPO_ROOT / "ArchLucid.Core" / "Diagnostics" / "ArchLucidInstrumentation.Runs.cs"
        )

        engine_invoke_text = "".join(
            path.read_text(encoding="utf-8")
            for path in sorted(findings_stages_dir.glob("FindingsEngineInvokeStage*.cs"))
        )
        snapshot_emit_text = snapshot_emit_stage.read_text(encoding="utf-8")
        self.assertIn("FindingEngineFailure", engine_invoke_text)
        self.assertIn("RecordFindingsEnginePartialFailure", snapshot_emit_text)

        provenance_text = provenance_populator.read_text(encoding="utf-8")
        requirements_text = requirements_populator.read_text(encoding="utf-8")
        self.assertIn("EngineFailures", provenance_text)
        self.assertIn("enrichment was skipped", provenance_text)
        self.assertIn("WarnSkippedFindingPayload", requirements_text)

        null_enricher = (
            REPO_ROOT
            / "ArchLucid.Decisioning"
            / "Findings"
            / "NullFindingsSnapshotEvaluationConfidenceEnricher.cs"
        )
        self.assertIn("EvaluationConfidenceEnrichmentSkipped = true", null_enricher.read_text(encoding="utf-8"))

        analyzer_text = "".join(
            path.read_text(encoding="utf-8")
            for path in sorted(analyzer_dir.glob("ExplainabilityTraceCompletenessAnalyzer*.cs"))
        )
        self.assertIn("ListHasMeaningfulAlternativePaths", analyzer_text)
        self.assertIn("RuleBasedDeterministicSinglePathNote", analyzer_text)

        instrumentation_text = instrumentation_root.read_text(encoding="utf-8") + instrumentation_runs.read_text(
            encoding="utf-8"
        )
        self.assertIn("archlucid_findings_engine_partial_failure_total", instrumentation_text)


if __name__ == "__main__":
    unittest.main()
