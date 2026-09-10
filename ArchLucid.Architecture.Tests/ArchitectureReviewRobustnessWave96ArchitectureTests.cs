using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-96 architecture create/review robustness suggestions 1137–1148.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave96ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1137_1143_authority_and_manifest_compare_outcome_sealed_manifest_conflict_mappers()
    {
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

        authorityCompare.Should().Contain("MapCompareSealedManifestConflict");
        manifestCompare.Should().Contain("MapGoldenManifestReadSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1144_1146_comparison_summary_risk_exception_and_policy_assignment_blocked_reason_wiring()
    {
        string comparisonRecordBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "compare",
                "comparison-record-blocked-reason.ts"));
        string comparisonRecordApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "comparison-record-api.ts"));
        string riskExceptionBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "governance",
                "risk-exception-mutation-blocked-reason.ts"));
        string stickinessApi = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "api",
                "governance-stickiness-api-exceptions-schedules.ts"));
        string assignBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "policy",
                "policy-pack-assign-mutation-blocked-reason.ts"));
        string assignApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "policy-packs-api-assign.ts"));

        comparisonRecordBlocked.Should().Contain("comparisonRecordBlockedReason");
        comparisonRecordApi.Should().Contain("comparisonRecordBlockedReason");
        riskExceptionBlocked.Should().Contain("riskExceptionMutationBlockedReason");
        stickinessApi.Should().Contain("riskExceptionMutationBlockedReason");
        assignBlocked.Should().Contain("policyPackAssignMutationBlockedReason");
        assignApi.Should().Contain("policyPackAssignMutationBlockedReason");
    }

    [Fact]
    public void Suggestion1147_1148_async_execute_and_sponsor_preliminary_share_blocked_reason_wiring()
    {
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
        string sponsorShareBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "pilots",
                "sponsor-preliminary-share-mutation-blocked-reason.ts"));
        string sponsorShareApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-sponsor-sharing-api.ts"));

        executeBlocked.Should().Contain("reviewExecuteMutationBlockedReason");
        lifecycleApi.Should().Contain("reviewExecuteMutationBlockedReason");
        sponsorShareBlocked.Should().Contain("sponsorPreliminaryShareMutationBlockedReason");
        sponsorShareApi.Should().Contain("sponsorPreliminaryShareMutationBlockedReason");
    }
}
