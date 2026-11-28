using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuthorityTopologyOfflineComparisonTests
{
    private static readonly Guid RunId = Guid.Parse("11f00000-0000-0000-0000-000000000001");
    private static readonly Guid ContextId = Guid.Parse("11f00000-0000-0000-0000-000000000002");
    private static readonly ProjectScopeKey Scope = ProjectScopeKey.Create(
        Guid.Parse("11f00000-0000-0000-0000-000000000003"),
        Guid.Parse("11f00000-0000-0000-0000-000000000004"),
        Guid.Parse("11f00000-0000-0000-0000-000000000005"));

    [Fact]
    public async Task Equivalent_rebuild_includes_engine_and_evidence_checks_without_mutating_inputs()
    {
        GraphSnapshot baseline = Topology();
        GraphSnapshot candidate = Topology();
        baseline.Nodes[0].Properties["publicEndpoint"] = "true";
        candidate.Nodes[0].Properties["publicEndpoint"] = "true";
        candidate.Nodes.Reverse();
        candidate.Edges.Reverse();
        string baselineJson = JsonSerializer.Serialize(baseline);
        string candidateJson = JsonSerializer.Serialize(candidate);

        AuthorityTopologyComparison result = await Compare(Input(baseline), Input(candidate));

        Assert.NotEqual(baseline.GraphSnapshotId, candidate.GraphSnapshotId);
        Assert.Equal(AuthorityTopologyComparisonOutcome.EquivalentForConsumer, result.Outcome);
        Assert.Equal(result.BaselineFingerprint, result.CandidateFingerprint);
        Assert.True(result.EngineMultisetMatches);
        Assert.True(result.EngineSequenceMatches);
        Assert.True(result.PathEvidenceMatches);
        Assert.True(result.AuthorityMergeSequenceMatches);
        Assert.Equal(baselineJson, JsonSerializer.Serialize(baseline));
        Assert.Equal(candidateJson, JsonSerializer.Serialize(candidate));
    }

    [Fact]
    public async Task Equal_raw_multisets_do_not_hide_a_change_in_merge_order()
    {
        GraphSnapshot baseline = Topology();
        GraphSnapshot candidate = Topology();
        baseline.Nodes.Insert(0, Resource("exposed", "api", GraphTopologyCategories.Compute, true));
        candidate.Nodes.Add(Resource("exposed", "api", GraphTopologyCategories.Compute, true));
        // Emit two findings through the same loop so that the reversed resource order changes the output order.
        baseline.Nodes[1].Properties["publicEndpoint"] = "true";
        candidate.Nodes[0].Properties["publicEndpoint"] = "true";

        AuthorityTopologyComparison result = await Compare(Input(baseline), Input(candidate));

        Assert.Equal(result.BaselineFingerprint, result.CandidateFingerprint);
        Assert.True(result.EngineMultisetMatches);
        Assert.False(result.EngineSequenceMatches);
        Assert.False(result.AuthorityMergeSequenceMatches);
        Assert.Equal(AuthorityTopologyComparisonOutcome.Different, result.Outcome);
        Assert.Equal("authority_merge_order_changed", result.Reason);
    }

    [Fact]
    public async Task Same_topology_and_raw_findings_do_not_hide_a_different_selected_evidence_path()
    {
        GraphSnapshot baseline = Diamond();
        GraphSnapshot candidate = Diamond();
        (candidate.Edges[0], candidate.Edges[1]) = (candidate.Edges[1], candidate.Edges[0]);

        Assert.Equal(["external", "left", "sql"], Assert.Single(DataFlowTrustBoundaryPathAnalyzer.Analyze(baseline)).PathNodeIds);
        Assert.Equal(["external", "right", "sql"], Assert.Single(DataFlowTrustBoundaryPathAnalyzer.Analyze(candidate)).PathNodeIds);

        AuthorityTopologyComparison result = await Compare(Input(baseline), Input(candidate));

        Assert.Equal(result.BaselineFingerprint, result.CandidateFingerprint);
        Assert.True(result.EngineMultisetMatches);
        Assert.False(result.PathEvidenceMatches);
        Assert.Equal("order_sensitive_path_evidence_changed", result.Reason);
        Assert.Equal(AuthorityTopologyComparisonOutcome.Different, result.Outcome);
    }

    [Theory]
    [InlineData("permissions")]
    [InlineData("direction")]
    [InlineData("weight")]
    [InlineData("lineage")]
    [InlineData("multiplicity")]
    [InlineData("endpoint")]
    public async Task Real_graph_changes_do_not_collapse_to_equivalence(string change)
    {
        GraphSnapshot baseline = Topology();
        GraphSnapshot changed = Topology();

        switch (change)
        {
            case "permissions":
                changed.Nodes[0].Properties["permissions"] = "read-and-write";
                break;
            case "direction":
                (changed.Edges[0].FromNodeId, changed.Edges[0].ToNodeId) =
                    (changed.Edges[0].ToNodeId, changed.Edges[0].FromNodeId);
                break;
            case "weight":
                changed.Edges[0].Weight = 0.5;
                break;
            case "lineage":
                changed.Edges[0].ProvenanceKind = "HumanAssertion";
                break;
            case "multiplicity":
                changed.Edges.Add(Edge("extra", "compute", "store"));
                break;
            case "endpoint":
                changed.Nodes[0].Properties["publicEndpoint"] = "true";
                break;
        }

        AuthorityTopologyComparison result = await Compare(Input(baseline), Input(changed));

        Assert.Equal(AuthorityTopologyComparisonOutcome.Different, result.Outcome);
        Assert.NotEqual(result.BaselineFingerprint, result.CandidateFingerprint);

        if (change == "endpoint")
            Assert.False(result.EngineMultisetMatches);
    }

    [Theory]
    [InlineData("duplicate_id")]
    [InlineData("missing_endpoint")]
    [InlineData("bad_weight")]
    [InlineData("unknown_format")]
    [InlineData("unsupported_version")]
    [InlineData("invalid_utf16")]
    [InlineData("oversized")]
    public async Task Ambiguous_or_unbounded_graphs_are_inconclusive(string change)
    {
        GraphSnapshot malformed = Topology();

        switch (change)
        {
            case "duplicate_id":
                malformed.Nodes[1].NodeId = malformed.Nodes[0].NodeId.ToUpperInvariant();
                break;
            case "missing_endpoint":
                malformed.Edges[0].ToNodeId = "missing";
                break;
            case "bad_weight":
                malformed.Edges[0].Weight = double.NaN;
                break;
            case "unknown_format":
                malformed = new ExtendedGraph();
                break;
            case "unsupported_version":
                malformed.SchemaVersion = 2;
                break;
            case "invalid_utf16":
                malformed.Nodes[0].Label = new string((char)0xd800, 1);
                break;
            case "oversized":
                malformed.Nodes[0].Label = new string('a', 2049);
                break;
        }

        if (change == "unknown_format")
        {
            malformed.RunId = RunId;
            malformed.ContextSnapshotId = ContextId;
        }

        AuthorityTopologyComparison result = await Compare(Input(Topology()), Input(malformed));

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal("graph_unsupported_or_ambiguous", result.Reason);
        Assert.Null(result.EngineMultisetMatches);
    }

    [Theory]
    [InlineData("scope", "scope_or_run_mismatch")]
    [InlineData("run", "scope_or_run_mismatch")]
    [InlineData("context", "scope_or_run_mismatch")]
    [InlineData("coverage", "prerequisites_unverified")]
    [InlineData("stale", "prerequisites_unverified")]
    [InlineData("missing_pin", "prerequisites_unverified")]
    [InlineData("engine_build", "comparison_version_unsupported")]
    [InlineData("projection_version", "comparison_version_unsupported")]
    public async Task Incompatible_or_unverified_inputs_never_compare_as_equal(string change, string reason)
    {
        AuthorityTopologyRehearsalInput input = Input(Topology());
        AuthorityTopologyRehearsalInput changed = change switch
        {
            "scope" => input with { Scope = ProjectScopeKey.Create(Scope.TenantId, Scope.WorkspaceId, Guid.NewGuid()) },
            "coverage" => input with { Coverage = AuthorityTopologyCoverage.Incomplete },
            "stale" => input with { Coverage = AuthorityTopologyCoverage.Stale },
            "missing_pin" => input with { EvidenceWitness = string.Empty },
            "engine_build" => input with { EngineBuild = Guid.NewGuid() },
            "projection_version" => input with { ProjectionVersion = "future" },
            _ => Input(Topology()),
        };

        if (change == "run")
            changed.Graph.RunId = Guid.NewGuid();

        if (change == "context")
            changed.Graph.ContextSnapshotId = Guid.NewGuid();

        AuthorityTopologyComparison result = await Compare(input, changed);

        Assert.Equal(AuthorityTopologyComparisonOutcome.Inconclusive, result.Outcome);
        Assert.Equal(reason, result.Reason);
    }

    [Fact]
    public async Task Changed_evidence_pin_is_different_even_when_graph_output_looks_identical()
    {
        AuthorityTopologyRehearsalInput input = Input(Topology());

        AuthorityTopologyComparison result = await Compare(input, input with { EvidenceWitness = new string('E', 64) });

        Assert.Equal(AuthorityTopologyComparisonOutcome.Different, result.Outcome);
        Assert.Equal("pinned_dependency_changed", result.Reason);
        Assert.NotEqual(result.BaselineFingerprint, result.CandidateFingerprint);
        Assert.Null(result.EngineMultisetMatches);
    }

    [Fact]
    public async Task Cancellation_is_honored_before_evaluation()
    {
        AuthorityTopologyRehearsalInput input = Input(Topology());
        using CancellationTokenSource canceled = new();
        await canceled.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            AuthorityTopologyOfflineComparison.CompareAsync(input, input, new FakeTimeProvider(), canceled.Token));
    }

    private static Task<AuthorityTopologyComparison> Compare(AuthorityTopologyRehearsalInput left,
        AuthorityTopologyRehearsalInput right) =>
        AuthorityTopologyOfflineComparison.CompareAsync(left, right, new FakeTimeProvider(), CancellationToken.None);

    private static AuthorityTopologyRehearsalInput Input(GraphSnapshot graph) => new(Scope, graph,
        new string('A', 64), new string('B', 64), new string('C', 64), new string('D', 64),
        AuthorityTopologyCoverage.VerifiedComplete, AuthorityTopologyOfflineComparison.ProjectionVersion,
        AuthorityTopologyOfflineComparison.EngineBuild);

    private static GraphSnapshot Topology() => Graph(
        [Resource("compute", "compute", GraphTopologyCategories.Compute), Resource("store", "SQL", GraphTopologyCategories.Storage)],
        [Edge("link", "compute", "store")]);

    private static GraphSnapshot Diamond() => Graph(
        [
            new GraphNode { NodeId = "external", NodeType = GraphNodeTypes.Actor, Label = "External", Properties = { ["trustOrigin"] = "External" } },
            Resource("left", "left", GraphTopologyCategories.Compute),
            Resource("right", "right", GraphTopologyCategories.Compute),
            Resource("sql", "SQL", GraphTopologyCategories.Storage),
        ],
        [Edge("e1", "external", "left"), Edge("e2", "external", "right"), Edge("e3", "left", "sql"), Edge("e4", "right", "sql")]);

    private static GraphSnapshot Graph(List<GraphNode> nodes, List<GraphEdge> edges) => new()
    {
        RunId = RunId, ContextSnapshotId = ContextId, GraphSnapshotId = Guid.NewGuid(),
        CreatedUtc = new DateTime(2026, 11, 27, 0, 0, 0, DateTimeKind.Utc), Nodes = nodes, Edges = edges,
    };

    private static GraphNode Resource(string id, string label, string category, bool exposed = false) => new()
    {
        NodeId = id, Label = label, NodeType = GraphNodeTypes.TopologyResource, Category = category,
        Properties = { ["category"] = category, ["publicEndpoint"] = exposed ? "true" : "false" },
    };

    private static GraphEdge Edge(string id, string from, string to) => new()
    {
        EdgeId = id, FromNodeId = from, ToNodeId = to, EdgeType = GraphEdgeTypes.ConnectsTo, ProvenanceKind = "ObservedFact",
    };

    private sealed class ExtendedGraph : GraphSnapshot;
}
