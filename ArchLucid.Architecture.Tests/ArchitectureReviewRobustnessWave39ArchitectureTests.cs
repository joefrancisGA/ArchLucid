using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-39 architecture create/review robustness suggestions 453–464.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave39ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion453_remediation_instance_list_sealed_hash_guard_and_409()
    {
        string queryService = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Application",
                "InfraEvidence",
                "RemediationInstances",
                "RemediationInstanceQueryService.cs"));
        string controller = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "InfraEvidence", "RemediationInstancesController.cs"));

        queryService.Should().Contain("ListInstancesAsync");
        queryService.Should().Contain("RemediationInstanceSealedManifestHashGuard.EnsureFindingLinkedRunSealedManifestHashOrThrowAsync");
        controller.Should().Contain("ListInstancesAsync");
        controller.Should().Contain("ConflictProblem");
        controller.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion455_456_demo_and_workspace_context_compare_facade_preflight()
    {
        string demoCompare = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Demo", "DemoViewerController.Compare.cs"));
        string workspaceContext = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunDetailPageBundleController.WorkspaceContext.cs"));

        demoCompare.Should().Contain("compareRunsFacade");
        demoCompare.Should().Contain("LoadScopedRunPairAsync");
        demoCompare.Should().Contain("MapScopedRunPairLoadOutcome");
        demoCompare.Should().Contain("Status409Conflict");
        workspaceContext.Should().Contain("LoadScopedRunPairAsync");
        workspaceContext.Should().Contain("PriorCommittedRunComparisonBlockedReason");
        workspaceContext.Should().Contain("MapPriorCompareBlockedReason");
    }

    [Fact]
    public void Suggestion458_464_openapi_409_roi_freshness_and_holistic_guard()
    {
        string replay = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ComparisonsController.Replay.cs"));
        string referenceExport = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "Pilots", "ReferenceEvidenceAdminExportService.cs"));
        string holistic = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Planning", "ExplanationController.CompareHolistic.cs"));

        replay.Should().Contain("ReplayComparisonsBatch");
        replay.Should().Contain("Status409Conflict");
        referenceExport.Should().Contain("ToResponseWithProofPackage");
        holistic.Should().Contain("SealedManifestReadGuard");
        holistic.Should().Contain("Status409Conflict");
    }

    [Fact]
    public void Suggestion454_457_460_463_compare_run_detail_and_infra_ui_fail_closed()
    {
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
        string deferredModel = File.ReadAllText(
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
                "load-run-detail-deferred-model.ts"));
        string sponsorPack = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "why-archlucid",
                "_sections",
                "WhyArchLucidSponsorPackBody.tsx"));
        string infraConflict = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "infra-evidence",
                "infra-evidence-sealed-manifest-conflict.ts"));
        string deliverablesCard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "governance",
                "sealed-records",
                "[manifestId]",
                "_sections",
                "ManifestDetailDeliverablesCard.tsx"));

        compareChrome.Should().Contain("compareRunPairBlockedReason(aiFailure)");
        deferredModel.Should().Contain("priorCommittedRunComparisonBlockedReason");
        sponsorPack.Should().Contain("roiSourceFreshnessDisposition");
        infraConflict.Should().Contain("infraEvidenceSealedManifestConflictMessage");
        deliverablesCard.Should().Contain("runCollateralSealedManifestCopyBlockedReason");
    }
}
