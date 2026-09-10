using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-98 architecture create/review robustness suggestions 1161–1172.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave98ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1161_1164_manifest_summary_governance_review_and_audit_export_action_level_sealed_manifest_conflict_mappers()
    {
        string authorityQueryGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityQueryController.SealedManifestGuard.cs"));
        string governanceReview = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.ApprovalRequests.Review.cs"));
        string auditExportGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "AuditController.Export.Guard.cs"));

        authorityQueryGuard.Should().Contain("MapRunQuerySealedManifestConflict");
        governanceReview.Should().Contain("MapGovernanceSealedManifestConflict");
        auditExportGuard.Should().Contain("MapAuditExportSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1165_1167_export_history_record_load_and_run_archive_sealed_manifest_conflict_mappers()
    {
        string exportsController = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ExportsController.cs"));
        string runArchive = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Archive.cs"));

        exportsController.Should().Contain("MapExportReplaySealedManifestConflict");
        runArchive.Should().Contain("MapRunsSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1168_1172_governance_draft_and_finding_disposition_blocked_reason_wiring()
    {
        string governanceBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-mutation-blocked-reason.ts"));
        string governanceApprovalsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "governance-workflow-api-approvals.ts"));
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));
        string draftLifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-lifecycle.ts"));
        string dispositionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "findings",
                "finding-disposition-mutation-blocked-reason.ts"));
        string bulkDispositionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "finding-bulk-disposition-blocked-reason.ts"));
        string dispositionsApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-dispositions.ts"));

        governanceBlocked.Should().Contain("governanceWorkflowMutationBlockedReason");
        governanceApprovalsApi.Should().Contain("governanceWorkflowMutationBlockedReason");
        draftBlocked.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        draftLifecycleApi.Should().Contain("architectureDraftIntakeMutationBlockedReason");
        dispositionBlocked.Should().Contain("findingDispositionMutationBlockedReason");
        bulkDispositionBlocked.Should().Contain("findingBulkDispositionBlockedReason");
        dispositionsApi.Should().Contain("findingDispositionMutationBlockedReason");
        dispositionsApi.Should().Contain("findingBulkDispositionBlockedReason");
    }
}
