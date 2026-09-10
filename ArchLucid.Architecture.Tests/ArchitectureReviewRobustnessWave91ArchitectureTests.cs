using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-91 architecture create/review robustness suggestions 1077–1088.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave91ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1077_1083_action_level_sealed_manifest_conflict_mappers()
    {
        string authorityReplay = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReplayController.cs"));
        string governancePreview = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePreviewController.cs"));
        string governancePosture = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernancePostureController.cs"));
        string policyPacksCrud = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "PolicyPacksController.Crud.cs"));
        string runsExecute = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunsController.Execute.cs"));
        string governanceMutationCorrections = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "GovernanceController.MutationCorrections.cs"));

        authorityReplay.Should().Contain("MapAuthorityReplaySealedManifestConflict");
        governancePreview.Should().Contain("MapGovernancePreviewSealedManifestConflict");
        governancePosture.Should().Contain("MapGovernancePostureSealedManifestConflict");
        policyPacksCrud.Should().Contain("MapPolicyPackSealedManifestConflict");
        runsExecute.Should().Contain("MapRunsSealedManifestConflict");
        governanceMutationCorrections.Should().Contain("MapGovernanceSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1084_1085_governance_setup_and_resolution_blocked_reason_wiring()
    {
        string setupBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));
        string resolutionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "governance-workflow-read-blocked-reason.ts"));
        string dashboardApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-workflow-api-dashboard.ts"));

        setupBlocked.Should().Contain("governanceSetupGuideBlockedReason");
        resolutionBlocked.Should().Contain("governanceResolutionBlockedReason");
        dashboardApi.Should().Contain("governanceSetupGuideBlockedReason");
        dashboardApi.Should().Contain("governanceResolutionBlockedReason");
    }

    [Fact]
    public void Suggestion1086_1088_compare_runs_execute_and_manifest_summary_blocked_reason_wiring()
    {
        string compareRunsBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "compare-runs-load-blocked-reason.ts"));
        string compareRunsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));
        string executeBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-execute-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string manifestSummaryBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "manifest-summary-read-blocked-reason.ts"));
        string artifactsApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-artifacts.ts"));

        compareRunsBlocked.Should().Contain("compareRunsLoadBlockedReason");
        compareRunsApi.Should().Contain("compareRunsLoadBlockedReason");
        executeBlocked.Should().Contain("reviewExecuteMutationBlockedReason");
        lifecycleApi.Should().Contain("reviewExecuteMutationBlockedReason");
        manifestSummaryBlocked.Should().Contain("manifestSummaryReadBlockedReason");
        artifactsApi.Should().Contain("manifestSummaryReadBlockedReason");
    }
}
