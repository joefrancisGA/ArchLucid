using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-29 architecture create/review robustness suggestions (311–335 Tier 1 batch).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave29ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion311_docx_compare_with_run_fail_closed_on_sealed_hash()
    {
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "DocxExportController.cs"));

        controller.Should().Contain("RunExportSealedManifestHashGuard");
        controller.Should().Contain("compareWithRunId.Value.ToString(\"N\")");
    }

    [Fact]
    public void Suggestion312_decision_receipt_run_build_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "DecisionReceiptService.cs"));

        service.Should().Contain("RunExportSealedManifestHashGuard");
        service.Should().Contain("BuildForRunAsync");
    }

    [Fact]
    public void Suggestion313_architecture_review_export_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Exports", "ArchitectureReviewExportService.cs"));

        service.Should().Contain("RunExportSealedManifestHashGuard");
        service.Should().Contain("GenerateReportAsync");
    }

    [Fact]
    public void Suggestion314_structured_diagram_ingest_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "StructuredDiagramIngestService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "StructuredDiagramIngestSealedManifestHashGuard.cs"));

        service.Should().Contain("StructuredDiagramIngestSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion315_diagram_infrastructure_reconciliation_fail_closed_on_sealed_hash()
    {
        string service = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "DiagramInfrastructureReconciliationService.cs"));
        string guard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "DiagramInfrastructureReconciliationSealedManifestHashGuard.cs"));

        service.Should().Contain("DiagramInfrastructureReconciliationSealedManifestHashGuard");
        guard.Should().Contain("GovernanceDispositionSealedManifestGuard");
    }

    [Fact]
    public void Suggestion316_first_value_report_fail_closed_on_sealed_hash()
    {
        string builder = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "FirstValueReportBuilder.cs"));

        builder.Should().Contain("RunExportSealedManifestHashGuard");
        builder.Should().Contain("BuildReportAsync");
    }

    [Fact]
    public void Suggestion326_submitted_architecture_copy_fail_closed()
    {
        string section = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "_sections",
                "RunDetailSubmittedArchitectureSection.tsx"));

        section.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion327_328_architecture_diagram_mermaid_copy_download_fail_closed()
    {
        string hook = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "architecture",
                "use-architecture-diagram-panel.ts"));

        hook.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        hook.Should().Contain("copyMermaid");
        hook.Should().Contain("downloadMermaid");
    }

    [Fact]
    public void Suggestion329_finding_iac_stub_copy_fail_closed()
    {
        string panel = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "findings", "FindingIacStubPanel.tsx"));

        panel.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }

    [Fact]
    public void Suggestion330_332_evidence_graph_export_fail_closed()
    {
        string experience = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "GraphLoadedExperience.tsx"));

        experience.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        experience.Should().Contain("ensureGraphExportAllowed");
    }

    [Fact]
    public void Suggestion333_golden_manifest_markdown_export_fail_closed()
    {
        string menu = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "components", "GoldenManifestExportMenu.tsx"));

        menu.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
        menu.Should().Contain("manifestSummarySealedVersionForCopyGuard");
    }
}
