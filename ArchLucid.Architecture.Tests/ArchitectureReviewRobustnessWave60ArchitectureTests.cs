using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-60 architecture create/review robustness suggestions 705–716.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave60ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion705_707_posture_seal_delta_and_export_replay_openapi_409()
    {
        string postureController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePostureController.cs"));
        string postureGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePostureController.SealedManifestGuard.cs"));
        string architecturesController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.cs"));
        string architecturesGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Architecture", "ArchitecturesController.SealedManifestGuard.cs"));
        string sealDeltaGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Architecture", "ArchitectureSealDeltaSealedManifestReadGuard.cs"));
        string exportsController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "ExportsController.cs"));

        postureController.Should().Contain("GetPosture");
        postureController.Should().Contain("EnsureGovernancePostureSealedManifestReadAllowedAsync");
        postureController.Should().Contain("Status409Conflict");
        postureGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        architecturesController.Should().Contain("GetSealDelta");
        architecturesController.Should().Contain("EnsureArchitectureSealDeltaSealedManifestReadAllowedAsync");
        architecturesGuard.Should().Contain("ArchitectureSealDeltaSealedManifestReadGuard");
        sealDeltaGuard.Should().Contain("ArchitectureIdentitySealedManifestReadGuard");
        exportsController.Should().Contain("ReplayExportRecord");
        exportsController.Should().Contain("EnsureSealedManifestReadAllowedForExportRecordAsync");
    }

    [Fact]
    public void Suggestion708_710_run_inventory_preview_and_coverage_preview_openapi_409()
    {
        string authorityReadsController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));
        string authorityReadsGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.SealedManifestGuard.cs"));
        string authorityQueryList = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.List.cs"));
        string authorityQueryGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.SealedManifestGuard.cs"));
        string runInventoryGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Runs", "RunInventorySealedManifestReadGuard.cs"));
        string previewController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePreviewController.cs"));
        string previewGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernancePreviewController.SealedManifestGuard.cs"));
        string coverageController = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Governance", "GovernanceCoverageController.cs"));
        string coveragePreviewGuard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "Governance",
                "Coverage",
                "GovernanceCoveragePreviewSealedManifestHashGuard.cs"));

        authorityReadsController.Should().Contain("ListRuns");
        authorityReadsController.Should().Contain("EnsureRunInventorySealedManifestReadAllowedAsync");
        authorityReadsController.Should().Contain("Status409Conflict");
        authorityReadsGuard.Should().Contain("RunInventorySealedManifestReadGuard");
        authorityQueryList.Should().Contain("ListRunsByProject");
        authorityQueryList.Should().Contain("ListRunsInScope");
        authorityQueryList.Should().Contain("EnsureRunInventorySealedManifestReadAllowedAsync");
        authorityQueryGuard.Should().Contain("RunInventorySealedManifestReadGuard");
        runInventoryGuard.Should().Contain("GovernancePostureSealedManifestHashGuard");
        previewController.Should().Contain("EnsureGovernancePreviewRunSealedManifestReadAllowedAsync");
        previewController.Should().Contain("EnsureGovernancePreviewScopeSealedManifestReadAllowedAsync");
        previewGuard.Should().Contain("GovernancePreviewSealedManifestHashGuard");
        coverageController.Should().Contain("PreviewCoverage");
        coverageController.Should().Contain("EnsureGovernanceCoveragePreviewSealedManifestReadAllowedAsync");
        coverageController.Should().Contain("Status409Conflict");
        coveragePreviewGuard.Should().Contain("EnsureCoveragePreviewAllowedOrThrowAsync");
    }

    [Fact]
    public void Suggestion711_712_run_list_and_draft_intake_sealed_clients()
    {
        string runsListApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-list.ts"));
        string runListBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-list-blocked-reason.ts"));
        string loadRunsPage = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string runsPageView = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string draftApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "draft-intake-api-crud.ts"));
        string draftHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-draft-query.ts"));
        string draftBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-draft-blocked-reason.ts"));

        runsListApi.Should().Contain("apiGet");
        runsListApi.Should().Contain("runListBlockedReason");
        runsListApi.Should().NotContain("apiGetSealedManifestAware");
        runListBlocked.Should().Contain("runListBlockedReason");
        loadRunsPage.Should().Contain("runListBlockedReason");
        runsPageView.Should().Contain("runs-page-list-blocked-reason");
        draftApi.Should().Contain("getDraftRequest");
        draftApi.Should().Contain("apiGetSealedManifestAware");
        draftHook.Should().Contain("architectureDraftBlockedReason");
        draftBlocked.Should().Contain("architectureDraftBlockedReason");
    }

    [Fact]
    public void Suggestion713_716_export_compare_search_drift_and_attestation_ui_wiring()
    {
        string exportCompareCallout = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string runDetailExports = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string comparePanel = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string comparePanelHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "compare-two-reviews",
                "_sections",
                "use-compare-results-panel.ts"));
        string driftHook = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-comparison-drift-download.ts"));
        string lineageContent = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string sponsorKpi = ArchitectureSourceProbe.ReadPathWithPartials(
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
        string overviewLoadState = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "_sections",
                "use-governance-overview-load-state.ts"));

        exportCompareCallout.Should().Contain("useExportRecordCompareQuery");
        runDetailExports.Should().Contain("RunDetailExportRecordCompareCallout");
        comparePanel.Should().Contain("compare-search-blocked-reason");
        comparePanel.Should().Contain("compare-drift-blocked-reason");
        comparePanelHook.Should().Contain("useComparisonSearchQuery");
        comparePanelHook.Should().Contain("useComparisonDriftDownload");
        driftHook.Should().Contain("comparisonDriftReportBlockedReason");
        lineageContent.Should().Contain("useGovernanceApprovalRationaleQuery");
        lineageContent.Should().Contain("approval-lineage-rationale-blocked-reason");
        sponsorKpi.Should().Contain("useRealizedValueAttestationQuery");
        sponsorKpi.Should().Contain("sponsor-attestation-blocked-reason");
        overviewLoadState.Should().Contain("useRealizedValueAttestationQuery");
    }
}
