using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-94 architecture create/review robustness suggestions 1113–1124.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave94ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1113_1119_coverage_replay_pilot_and_compare_action_level_sealed_manifest_conflict_mappers()
    {
        string runCoverageAck = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.Acknowledgement.cs"));
        string authorityReplay = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityReplayController.cs"));
        string pilotPacks = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Pilots",
                "PilotsController.Packs.cs"));
        string authorityCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "AuthorityCompareController.cs"));
        string manifestCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Governance",
                "ManifestsController.Compare.cs"));

        runCoverageAck.Should().Contain("MapRunCoverageSealedManifestConflict");
        authorityReplay.Should().Contain("MapAuthorityReplaySealedManifestConflict");
        pilotPacks.Should().Contain("MapPilotPackSealedManifestConflict");
        authorityCompare.Should().Contain("MapCompareSealedManifestConflict");
        manifestCompare.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1120_1123_async_create_replay_and_policy_pack_blocked_reason_wiring()
    {
        string createBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "architecture-request-create-mutation-blocked-reason.ts"));
        string createAsyncApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-create-async.ts"));
        string replayBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "review-replay-mutation-blocked-reason.ts"));
        string replayApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "recommendation-replay-api.ts"));
        string policyMutateBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-mutation-blocked-reason.ts"));
        string policyDryRunBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-dry-run-mutation-blocked-reason.ts"));
        string policyMutateApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-mutate.ts"));

        createBlocked.Should().Contain("architectureRequestCreateMutationBlockedReason");
        createAsyncApi.Should().Contain("architectureRequestCreateMutationBlockedReason");
        replayBlocked.Should().Contain("reviewReplayMutationBlockedReason");
        replayApi.Should().Contain("reviewReplayMutationBlockedReason");
        policyMutateBlocked.Should().Contain("policyPackMutationBlockedReason");
        policyDryRunBlocked.Should().Contain("policyPackDryRunMutationBlockedReason");
        policyMutateApi.Should().Contain("policyPackMutationBlockedReason");
        policyMutateApi.Should().Contain("policyPackDryRunMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1124_compare_and_explain_get_blocked_reason_wiring()
    {
        string compareLoadBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "compare-runs-load-blocked-reason.ts"));
        string agentCompareBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "compare-agent-results-blocked-reason.ts"));
        string explainRunBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "explain",
                "explain-run-blocked-reason.ts"));
        string compareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-compare.ts"));

        compareLoadBlocked.Should().Contain("compareRunsLoadBlockedReason");
        agentCompareBlocked.Should().Contain("compareAgentResultsBlockedReason");
        explainRunBlocked.Should().Contain("explainRunBlockedReason");
        compareApi.Should().Contain("compareRunsLoadBlockedReason");
        compareApi.Should().Contain("compareAgentResultsBlockedReason");
        compareApi.Should().Contain("explainRunBlockedReason");
    }
}
