using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-114 architecture create/review robustness suggestions 1353–1364.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave114ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1353_1355_architecture_graph_full_page_and_temporal_snapshot_sealed_manifest_mappers()
    {
        string reviewGraph = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.ReviewGraph.cs"));
        string snapshot = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.Snapshot.cs"));

        reviewGraph.Should().Contain("MapGraphSealedManifestConflict");
        reviewGraph.Should().Contain("GetArchitectureGraph");
        reviewGraph.Should().Contain("GetArchitectureGraphNodesPage");
        snapshot.Should().Contain("MapGraphSealedManifestConflict");
        snapshot.Should().Contain("GetArchitectureGraphTemporalSnapshot");
    }

    [Fact]
    public void Suggestion1356_1359_interactive_graph_run_query_and_graph_guard_sealed_manifest_mappers()
    {
        string provenance = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Authority",
                "RunQueryController.Provenance.cs"));
        string guard = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "Planning",
                "GraphController.SealedManifestGuard.cs"));

        provenance.Should().Contain("MapProductRunQuerySealedManifestConflict");
        provenance.Should().Contain("GetInteractiveGraphSnapshot");
        provenance.Should().Contain("GetRunDecisions");
        provenance.Should().Contain("GetRunEvidence");
        guard.Should().Contain("MapGraphSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1360_1364_architecture_graph_paging_temporal_snapshot_and_fail_closed_wiring()
    {
        string graphApi = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "graph-api.ts"));
        string graphBlocked = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "graph",
                "architecture-graph-temporal-snapshot-blocked-reason.ts"));
        string loadViewModel = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "load-architecture-graph-view-model.ts"));
        string graphPageFetch = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "use-graph-page-fetch.ts"));
        string graphError = ArchitectureSourceProbe.ReadPathWithPartials(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "insights",
                "evidence-graph",
                "_sections",
                "GraphBuyerEvidenceTrailError.tsx"));

        graphApi.Should().Contain("getArchitectureGraph");
        graphApi.Should().Contain("getArchitectureGraphPage");
        graphApi.Should().Contain("mergeArchitectureGraphPages");
        graphApi.Should().Contain("getArchitectureGraphTemporalSnapshot");
        graphApi.Should().Contain("architectureGraphReadBlockedReason");
        graphApi.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        graphBlocked.Should().Contain("architectureGraphReadBlockedReason");
        graphBlocked.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        loadViewModel.Should().Contain("architectureGraphReadBlockedReason");
        loadViewModel.Should().Contain("architectureGraphTemporalSnapshotBlockedReason");
        graphPageFetch.Should().Contain("architectureGraphReadBlockedReason");
        graphError.Should().Contain("evidenceGraphBlockedReason");
    }
}
