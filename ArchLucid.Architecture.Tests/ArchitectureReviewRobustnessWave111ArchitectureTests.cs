using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-111 architecture create/review robustness suggestions 1317–1328.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave111ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1317_1319_review_trail_rationale_manifest_summary_and_golden_manifest_sealed_manifest_mappers()
    {
        string trail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityQueryController.Trail.cs"));

        trail.Should().Contain("MapRunQuerySealedManifestConflict");
        trail.Should().Contain("GetRunRationale");
        trail.Should().Contain("GetManifestSummary");
        trail.Should().Contain("GetRunGoldenManifest");
    }

    [Fact]
    public void Suggestion1320_1323_review_trail_reads_run_manifest_and_detail_sealed_manifest_mappers()
    {
        string reads = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "AuthorityReadsController.cs"));

        reads.Should().Contain("MapReviewTrailSealedManifestConflict");
        reads.Should().Contain("GetReviewTrail");
        reads.Should().Contain("GetReviewTrailRationale");
        reads.Should().Contain("GetRunManifest");
        reads.Should().Contain("GetRunDetail");
    }

    [Fact]
    public void Suggestion1324_1328_rationale_trail_manifest_explanation_and_provenance_blocked_reason_wiring()
    {
        string detailArtifacts = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-detail-artifacts.ts"));
        string runsList = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string rationaleBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-rationale-blocked-reason.ts"));
        string reviewTrailBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-review-trail-blocked-reason.ts"));
        string manifestBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "runs", "run-manifest-read-blocked-reason.ts"));
        string explanationBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "explain",
                "run-explanation-summary-blocked-reason.ts"));
        string provenanceBlocked = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "provenance", "run-provenance-blocked-reason.ts"));

        detailArtifacts.Should().Contain("runRationaleBlockedReason");
        detailArtifacts.Should().Contain("getRunRationale");
        detailArtifacts.Should().Contain("runManifestReadBlockedReason");
        detailArtifacts.Should().Contain("getAuthorityRunManifest");
        detailArtifacts.Should().Contain("runExplanationSummaryBlockedReason");
        detailArtifacts.Should().Contain("getRunExplanationSummary");
        detailArtifacts.Should().Contain("runProvenanceBlockedReason");
        detailArtifacts.Should().Contain("getArchitectureRunProvenance");
        runsList.Should().Contain("runReviewTrailBlockedReason");
        runsList.Should().Contain("getReviewTrail");
        rationaleBlocked.Should().Contain("runRationaleBlockedReason");
        reviewTrailBlocked.Should().Contain("runReviewTrailBlockedReason");
        manifestBlocked.Should().Contain("runManifestReadBlockedReason");
        explanationBlocked.Should().Contain("runExplanationSummaryBlockedReason");
        provenanceBlocked.Should().Contain("runProvenanceBlockedReason");
    }
}
