using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-122 architecture create/review robustness suggestions 1449–1460.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave122ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1449_1456_governance_and_review_trail_sealed_manifest_mappers()
    {
        string authorityReads = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string governanceLists = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.PromotionsActivations.cs"));
        string governanceInsights = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.Insights.cs"));
        string governanceGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.SealedManifestGuard.cs"));
        string runQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.SealedManifestGuard.cs"));

        authorityReads.Should().Contain("GetReviewTrailExport");
        authorityReads.Should().Contain("MapReviewTrailSealedManifestConflict");
        governanceLists.Should().Contain("GetApprovalRequests");
        governanceLists.Should().Contain("GetPromotions");
        governanceLists.Should().Contain("GetActivations");
        governanceLists.Should().Contain("MapGovernanceSealedManifestConflict");
        governanceInsights.Should().Contain("GetApprovalRequestLineage");
        governanceInsights.Should().Contain("GetApprovalRequestRationale");
        governanceInsights.Should().Contain("MapGovernanceSealedManifestConflict");
        governanceGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        governanceGuard.Should().Contain("MapGovernanceSealedManifestConflict");
        runQueryGuard.Should().Contain("EnsureSealedManifestReadAllowedAsync");
        runQueryGuard.Should().Contain("MapProductRunQuerySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1457_1459_governance_workflow_and_coordinator_provenance_blocked_reason_wiring()
    {
        string approvalsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));
        string workflowRunBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-run-read-blocked-reason.ts"));
        string lineageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-approval-lineage-blocked-reason.ts"));
        string environmentsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-environments.ts"));
        string activationsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));
        string detailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string provenanceBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "provenance", "run-provenance-blocked-reason.ts"));
        string workflowHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-governance-workflow-run-lists-query.ts"));
        string lineageHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-approval-request-lineage-query.ts"));

        approvalsApi.Should().Contain("listApprovalRequests");
        approvalsApi.Should().Contain("listPromotions");
        approvalsApi.Should().Contain("getApprovalRequestLineage");
        approvalsApi.Should().Contain("getGovernanceApprovalRationale");
        approvalsApi.Should().Contain("governanceWorkflowRunReadBlockedReason");
        approvalsApi.Should().Contain("governanceApprovalLineageBlockedReason");
        workflowRunBlocked.Should().Contain("governanceWorkflowRunReadBlockedReason");
        lineageBlocked.Should().Contain("governanceApprovalLineageBlockedReason");
        environmentsApi.Should().Contain("listActivations");
        environmentsApi.Should().Contain("governanceActivationsBlockedReason");
        activationsBlocked.Should().Contain("governanceActivationsBlockedReason");
        detailArtifacts.Should().Contain("getArchitectureRunProvenance");
        detailArtifacts.Should().Contain("/v1/architecture/reviews/");
        detailArtifacts.Should().Contain("runProvenanceBlockedReason");
        provenanceBlocked.Should().Contain("runProvenanceBlockedReason");
        workflowHook.Should().Contain("governanceWorkflowRunReadBlockedReason");
        lineageHook.Should().Contain("governanceApprovalLineageBlockedReason");
    }

    [Fact]
    public void Suggestion1460_governance_workflow_traceability_and_provenance_fail_closed_ux()
    {
        string workflowCallout = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "components",
                "governance",
                "GovernanceWorkflowRunListsBlockedCallout.tsx"));
        string runActions = File.ReadAllText(
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
                "RunDetailRunActionsSection.tsx"));
        string traceabilityBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "traceability-bundle-export-blocked-reason.ts"));
        string provenancePage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "[reviewId]",
                "provenance",
                "page.tsx"));

        workflowCallout.Should().Contain("governance-workflow-run-lists-blocked");
        workflowCallout.Should().Contain("governanceWorkflowRunReadBlockedReason");
        runActions.Should().Contain("run-actions-traceability-bundle-blocked-reason");
        runActions.Should().Contain("traceabilityBundleExportBlockedReason");
        traceabilityBlocked.Should().Contain("traceabilityBundleExportBlockedReason");
        provenancePage.Should().Contain("runProvenanceBlockedReason");
        provenancePage.Should().Contain("getArchitectureRunProvenance");
    }
}
