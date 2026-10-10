using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-54 architecture create/review robustness suggestions 633–644.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave54ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion633_638_review_trail_export_record_comparisons_and_provenance_openapi_409()
    {
        string authorityReads = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string exports = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string exportGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.SealedManifestGuard.cs"));
        string comparisons = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.History.cs"));
        string comparisonGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.SealedManifestGuard.cs"));
        string provenance = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Provenance.cs"));

        authorityReads.Should().Contain("GetReviewTrailExport");
        authorityReads.Should().Contain("SealedManifestReadGuard");
        authorityReads.Should().Contain("Status409Conflict");
        exports.Should().Contain("GetExportRecord");
        exports.Should().Contain("EnsureSealedManifestReadAllowedForExportRecordAsync");
        exportGuard.Should().Contain("EnsureSealedManifestReadAllowedForExportRecordAsync");
        comparisons.Should().Contain("GetExportRecordComparisonHistory");
        comparisons.Should().Contain("GetComparisonRecord");
        comparisons.Should().Contain("GetComparisonSummary");
        comparisons.Should().Contain("EnsureSealedManifestReadAllowedForExportRecordAsync");
        comparisons.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordAsync");
        comparisons.Should().Contain("Status409Conflict");
        comparisonGuard.Should().Contain("EnsureSealedManifestReadAllowedForComparisonRecordAsync");
        provenance.Should().Contain("GetArchitectureRunProvenance");
        provenance.Should().Contain("GetProvenanceNodeExplanation");
        provenance.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        provenance.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion639_641_governance_workflow_sealed_reads_and_blocked_reason_hooks()
    {
        string approvalsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));
        string environmentsApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-environments.ts"));
        string workflowHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-workflow-run-lists-query.ts"));
        string workflowBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "governance", "governance-workflow-run-read-blocked-reason.ts"));

        approvalsApi.Should().Contain("listApprovalRequests");
        approvalsApi.Should().Contain("listPromotions");
        approvalsApi.Should().Contain("apiGetSealedManifestAware");
        environmentsApi.Should().Contain("listActivations");
        environmentsApi.Should().Contain("apiGetSealedManifestAware");
        workflowHook.Should().Contain("governanceWorkflowRunReadBlockedReason");
        workflowBlocked.Should().Contain("governanceWorkflowRunReadBlockedReason");
    }

    [Fact]
    public void Suggestion642_643_run_export_history_and_review_trail_provenance_clients()
    {
        string exportHistoryHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-run-export-history-query.ts"));
        string exportHistoryApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-export-history-api.ts"));
        string exportHistoryBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "exports", "run-export-history-blocked-reason.ts"));
        string detailArtifacts = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string provenanceBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "provenance", "run-provenance-blocked-reason.ts"));

        exportHistoryHook.Should().Contain("getRunExportHistory");
        exportHistoryHook.Should().Contain("runExportHistoryBlockedReason");
        exportHistoryApi.Should().Contain("apiGetSealedManifestAware");
        exportHistoryBlocked.Should().Contain("runExportHistoryBlockedReason");
        detailArtifacts.Should().Contain("getRunProvenance");
        detailArtifacts.Should().Contain("/v1/runs/");
        detailArtifacts.Should().Contain("review-trail/provenance");
        detailArtifacts.Should().Contain("apiGetSealedManifestAware");
        provenanceBlocked.Should().Contain("runProvenanceBlockedReason");
    }

    [Fact]
    public void Suggestion644_export_record_comparison_history_client()
    {
        string exportRecordComparisonApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "export-record-comparison-api.ts"));
        string exportRecordComparisonBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "export-record-comparison-history-blocked-reason.ts"));

        exportRecordComparisonApi.Should().Contain("getExportRecordComparisonHistory");
        exportRecordComparisonApi.Should().Contain("apiGetSealedManifestAware");
        exportRecordComparisonApi.Should().Contain("/v1/architecture/run/exports/");
        exportRecordComparisonBlocked.Should().Contain("exportRecordComparisonHistoryBlockedReason");
    }
}
