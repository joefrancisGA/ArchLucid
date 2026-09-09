using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-78 architecture create/review robustness suggestions 921–932.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave78ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion921_927_docx_ledger_clarification_graph_run_query_and_infra_openapi_409()
    {
        string docxExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "DocxExportController.cs"));
        string docxGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "DocxExportController.SealedManifestGuard.cs"));
        string technologyLedger = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "TechnologyLedgerController.cs"));
        string technologyLedgerGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "TechnologyLedgerController.SealedManifestGuard.cs"));
        string clarificationQuestions = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.cs"));
        string clarificationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewClarificationQuestionsController.SealedManifestGuard.cs"));
        string reviewGraph = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.ReviewGraph.cs"));
        string graphSnapshot = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.Snapshot.cs"));
        string graphGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.SealedManifestGuard.cs"));
        string runDetail = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Detail.cs"));
        string runFindings = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Findings.cs"));
        string runProvenance = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Provenance.cs"));
        string runQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.SealedManifestGuard.cs"));
        string snapshotsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceSnapshotsController.cs"));
        string snapshotsGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "InfraEvidenceSnapshotsController.SealedManifestGuard.cs"));
        string remediationController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "RemediationInstancesController.cs"));
        string remediationGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "InfraEvidence",
                "RemediationInstancesController.SealedManifestGuard.cs"));

        docxExport.Should().Contain("ExportRunDocx");
        docxExport.Should().Contain("EnsureArchitecturePackageDocxSealedManifestAllowedAsync");
        docxExport.Should().Contain("EnsureCompareRunDocxSealedManifestAllowedAsync");
        docxExport.Should().Contain("Status409Conflict");
        docxGuard.Should().Contain("ConsultingDocxExportSealedReceiptGuard");
        docxGuard.Should().Contain("RunExportSealedManifestHashGuard");
        technologyLedger.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        technologyLedger.Should().Contain("Status409Conflict");
        technologyLedgerGuard.Should().Contain("SealedManifestReadGuard");
        clarificationQuestions.Should().Contain("GetClarificationQuestions");
        clarificationQuestions.Should().Contain("ApplyKnowledgeModelClarificationAnswers");
        clarificationQuestions.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        clarificationGuard.Should().Contain("SealedManifestReadGuard");
        reviewGraph.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        graphSnapshot.Should().Contain("EnsureGoldenManifestSealedReadAllowed");
        graphGuard.Should().Contain("SealedManifestReadGuard");
        runDetail.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runFindings.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runProvenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runQueryGuard.Should().Contain("SealedManifestReadGuard");
        snapshotsController.Should().Contain("MapSnapshotSealedManifestConflict");
        snapshotsController.Should().Contain("Status409Conflict");
        snapshotsGuard.Should().Contain("InfraEvidenceSnapshotSealedManifestHashGuard");
        remediationController.Should().Contain("MapRemediationSealedManifestConflict");
        remediationController.Should().Contain("IsSealedManifestConflict");
        remediationGuard.Should().Contain("RemediationInstanceSealedManifestHashGuard");
    }

    [Fact]
    public void Suggestion928_931_sponsor_csv_compare_explain_and_diagram_mutation_blocked_reason_wiring()
    {
        string sponsorCsvBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-roi-csv-export-mutation-blocked-reason.ts"));
        string sponsorSection = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorRoiSummarySection.tsx"));
        string compareExplainBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "compare-explain-mutation-blocked-reason.ts"));
        string compareChrome = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanelVerdictChrome.tsx"));
        string diagramIngestBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "diagram-ingest-mutation-blocked-reason.ts"));
        string diagramReconcileBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "diagram-reconcile-mutation-blocked-reason.ts"));
        string diagramWorkbench = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "diagram-reconcile",
                "DiagramReconcileWorkbenchClient.tsx"));

        sponsorCsvBlocked.Should().Contain("sponsorRoiCsvExportMutationBlockedReason");
        sponsorSection.Should().Contain("sponsorRoiCsvExportMutationBlockedReason");
        compareExplainBlocked.Should().Contain("compareExplainMutationBlockedReason");
        compareChrome.Should().Contain("compareExplainMutationBlockedReason");
        diagramIngestBlocked.Should().Contain("diagramIngestMutationBlockedReason");
        diagramReconcileBlocked.Should().Contain("diagramReconcileMutationBlockedReason");
        diagramWorkbench.Should().Contain("diagramIngestMutationBlockedReason");
        diagramWorkbench.Should().Contain("diagramReconcileMutationBlockedReason");
    }

    [Fact]
    public void Suggestion932_remediation_workbench_mutation_blocked_reason_wiring()
    {
        string remediationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "remediation-instance-mutation-blocked-reason.ts"));
        string remediationWorkbench = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "infrastructure",
                "remediation",
                "RemediationWorkbenchClient.tsx"));

        remediationBlocked.Should().Contain("remediationInstanceMutationBlockedReason");
        remediationWorkbench.Should().Contain("remediationInstanceMutationBlockedReason");
        remediationWorkbench.Should().Contain("formatRemediationWorkbenchApiError");
    }
}
