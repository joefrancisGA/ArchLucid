using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-128 architecture create/review robustness suggestions 1521–1532.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave128ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1521_1526_posture_seal_delta_export_replay_inventory_preview_and_coverage_runtime_409_mappers()
    {
        string postureController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePostureController.cs"));
        string postureGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePostureController.SealedManifestGuard.cs"));
        string architecturesController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.cs"));
        string exportsController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));
        string authorityReadsController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string authorityQueryList = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.List.cs"));
        string previewController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePreviewController.cs"));
        string coverageController = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceCoverageController.cs"));

        postureController.Should().Contain("GetPosture");
        postureController.Should().Contain("MapGovernancePostureSealedManifestConflict");
        postureGuard.Should().Contain("EnsureGovernancePostureSealedManifestReadAllowedAsync");
        architecturesController.Should().Contain("GetSealDelta");
        architecturesController.Should().Contain("MapArchitectureSealedManifestConflict");
        exportsController.Should().Contain("ReplayExportRecord");
        exportsController.Should().Contain("MapExportReplaySealedManifestConflict");
        authorityReadsController.Should().Contain("ListRuns");
        authorityReadsController.Should().Contain("MapReviewTrailSealedManifestConflict");
        authorityQueryList.Should().Contain("ListRunsByProject");
        authorityQueryList.Should().Contain("ListRunsInScope");
        authorityQueryList.Should().Contain("MapRunQuerySealedManifestConflict");
        previewController.Should().Contain("MapGovernancePreviewSealedManifestConflict");
        coverageController.Should().Contain("PreviewCoverage");
        coverageController.Should().Contain("MapGovernanceCoverageSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1527_1528_run_list_and_draft_intake_get_api_get_blocked_reason_wiring()
    {
        string runsListApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-list.ts"));
        string runListBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-list-blocked-reason.ts"));
        string loadRunsPage = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "_sections",
                "load-runs-page-model.ts"));
        string draftApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-crud.ts"));
        string draftHook = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-query.ts"));
        string draftBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-draft-blocked-reason.ts"));

        runsListApi.Should().Contain("listRunsByProjectPaged");
        runsListApi.Should().Contain("listRunsInScopePaged");
        runsListApi.Should().Contain("apiGet");
        runsListApi.Should().Contain("runListBlockedReason");
        runsListApi.Should().NotContain("apiGetSealedManifestAware");
        runListBlocked.Should().Contain("runListBlockedReason");
        loadRunsPage.Should().Contain("runListBlockedReason");
        draftApi.Should().Contain("getDraftRequest");
        draftApi.Should().Contain("apiGet");
        draftApi.Should().Contain("architectureDraftBlockedReason");
        draftHook.Should().Contain("architectureDraftBlockedReason");
        draftBlocked.Should().Contain("architectureDraftBlockedReason");
    }

    [Fact]
    public void Suggestion1529_1532_export_compare_search_drift_approval_lineage_and_attestation_fail_closed_hooks()
    {
        string exportCompareCallout = File.ReadAllText(
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
                "RunDetailExportRecordCompareCallout.tsx"));
        string runDetailExports = File.ReadAllText(
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
                "RunDetailArtifactsExportsSection.tsx"));
        string comparePanel = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "CompareResultsPanel.tsx"));
        string lineageContent = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "approval-requests",
                "[id]",
                "lineage",
                "_sections",
                "GovernanceApprovalLineageDetailContent.tsx"));
        string sponsorKpi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "sponsor-dashboard",
                "_sections",
                "SponsorRoiDashboardLiveKpiCards.tsx"));
        string runsPageView = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "reviews",
                "_sections",
                "RunsPageView.tsx"));

        exportCompareCallout.Should().Contain("useExportRecordCompareQuery");
        runDetailExports.Should().Contain("RunDetailExportRecordCompareCallout");
        comparePanel.Should().Contain("compare-search-blocked-reason");
        comparePanel.Should().Contain("compare-drift-blocked-reason");
        lineageContent.Should().Contain("useGovernanceApprovalRationaleQuery");
        lineageContent.Should().Contain("approval-lineage-rationale-blocked-reason");
        sponsorKpi.Should().Contain("useRealizedValueAttestationQuery");
        sponsorKpi.Should().Contain("sponsor-attestation-blocked-reason");
        runsPageView.Should().Contain("runs-page-list-blocked-reason");
    }
}
