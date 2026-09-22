using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-109 architecture create/review robustness suggestions 1293–1304.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave109ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1293_1296_coverage_ack_mutations_and_explanation_sealed_manifest_mappers()
    {
        string coverageAck = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunCoverageController.Acknowledgement.cs"));
        string explainCompare = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "ExplanationController.CompareHolistic.cs"));

        coverageAck.Should().Contain("MapRunCoverageSealedManifestConflict");
        explainCompare.Should().Contain("MapExplanationSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1297_1299_run_query_provenance_detail_and_findings_sealed_manifest_mappers()
    {
        string provenance = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Provenance.cs"));
        string detail = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Detail.cs"));
        string findings = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Api", "Controllers", "Authority", "RunQueryController.Findings.cs"));

        provenance.Should().Contain("MapProductRunQuerySealedManifestConflict");
        detail.Should().Contain("MapProductRunQuerySealedManifestConflict");
        findings.Should().Contain("MapProductRunQuerySealedManifestConflict");
    }

    [Fact]
    public void Suggestion1300_1304_coverage_timeline_graph_page_and_acknowledgement_blocked_reason_wiring()
    {
        string coverageApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "run-coverage-api.ts"));
        string coverageBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-coverage-acknowledgement-mutation-blocked-reason.ts"));
        string runsListApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "api", "architecture-runs-read-list.ts"));
        string pipelineBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "runs",
                "run-pipeline-timeline-blocked-reason.ts"));
        string graphApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string graphBlocked = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "architecture-graph-temporal-snapshot-blocked-reason.ts"));

        coverageApi.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        coverageApi.Should().Contain("patchRunCoveragePack");
        coverageApi.Should().Contain("getRunCoverageAcknowledgement");
        coverageBlocked.Should().Contain("runCoverageAcknowledgementMutationBlockedReason");
        runsListApi.Should().Contain("runPipelineTimelineBlockedReason");
        pipelineBlocked.Should().Contain("runPipelineTimelineBlockedReason");
        graphApi.Should().Contain("architectureGraphReadBlockedReason");
        graphBlocked.Should().Contain("architectureGraphReadBlockedReason");
    }
}
