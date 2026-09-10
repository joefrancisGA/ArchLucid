using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-93 architecture create/review robustness suggestions 1101–1112.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave93ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1101_1107_comparison_demo_and_admin_action_level_sealed_manifest_conflict_mappers()
    {
        string runComparisonReplay = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunComparisonController.Replay.cs"));
        string manifestCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Compare.cs"));
        string reviewsDemo = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "ReviewsDemoController.cs"));
        string quickStart = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Demo",
                "QuickStartController.cs"));
        string operations = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "OperationsController.cs"));
        string referenceEvidenceZip = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Admin",
                "ReferenceEvidenceAdminZipResultFactory.cs"));
        string authorityCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityCompareController.cs"));

        runComparisonReplay.Should().Contain("MapRunComparisonSealedManifestConflict");
        manifestCompare.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
        reviewsDemo.Should().Contain("MapReviewsDemoSealedManifestConflict");
        quickStart.Should().Contain("MapQuickStartSealedManifestConflict");
        operations.Should().Contain("MapOperationsSealedManifestConflict");
        referenceEvidenceZip.Should().Contain("MapReferenceEvidenceAdminSealedManifestConflict");
        authorityCompare.Should().Contain("MapCompareSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1108_1111_create_replay_coverage_and_simulate_blocked_reason_wiring()
    {
        string createBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-create-mutation-blocked-reason.ts"));
        string createHelpers = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-create-helpers.ts"));
        string asyncReplayBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-async-replay-mutation-blocked-reason.ts"));
        string lifecycleApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-lifecycle.ts"));
        string coverageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-coverage-acknowledgement-mutation-blocked-reason.ts"));
        string coverageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-coverage-api.ts"));
        string simulateBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-simulate-blocked-reason.ts"));
        string policyMutateApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-mutate.ts"));

        createBlocked.Should().Contain("architectureRequestCreateMutationBlockedReason");
        createHelpers.Should().Contain("architectureRequestCreateMutationBlockedReason");
        asyncReplayBlocked.Should().Contain("reviewAsyncReplayMutationBlockedReason");
        lifecycleApi.Should().Contain("reviewAsyncReplayMutationBlockedReason");
        coverageBlocked.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        coverageApi.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        simulateBlocked.Should().Contain("policyPackSimulateBlockedReason");
        policyMutateApi.Should().Contain("policyPackSimulateBlockedReason");
    }

    [Fact]
    public void Suggestion1112_golden_manifest_compare_and_explain_blocked_reason_wiring()
    {
        string compareBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "compare-runs-load-blocked-reason.ts"));
        string explainBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "compare-explain-mutation-blocked-reason.ts"));
        string compareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));

        compareBlocked.Should().Contain("compareRunsLoadBlockedReason");
        explainBlocked.Should().Contain("compareExplainMutationBlockedReason");
        compareApi.Should().Contain("compareRunsLoadBlockedReason");
        compareApi.Should().Contain("compareExplainMutationBlockedReason");
    }
}
