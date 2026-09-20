using ArchLucid.Contracts.Findings;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Time.Testing;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

[Trait("Suite", "Core")]
public sealed class GoldenCorpusCrossRunDiffCoverageTests
{
    private static readonly Guid RunId = Guid.Parse("20000000-0000-4000-8000-000000000074");
    private static readonly Guid ContextSnapshotId = Guid.Parse("10000000-0000-4000-8000-000000000074");
    private static readonly Guid CurrentGraphSnapshotId = Guid.Parse("00000074-0000-4000-8000-000000000074");
    private static readonly Guid PriorRunId = Guid.Parse("20000000-0000-4000-8000-000000000073");
    private static readonly Guid PriorGraphSnapshotId = Guid.Parse("00000073-0000-4000-8000-000000000074");

    [Fact]
    public async Task Harness_with_prior_graph_exercises_requirement_and_topology_cross_run_diff_engines()
    {
        string compliance = Path.Combine(
            AppContext.BaseDirectory,
            "Compliance",
            "RulePacks",
            "default-compliance.rules.json");

        File.Exists(compliance).Should().BeTrue();

        FakeTimeProvider clock = new();
        clock.SetUtcNow(new DateTimeOffset(2026, 9, 20, 12, 0, 0, TimeSpan.Zero));
        GoldenCorpusHarness harness = new(compliance, clock);

        GraphSnapshot current = BuildCurrentGraph();
        GoldenCorpusPriorGraphFixtureDocument priorFixture = new()
        {
            PriorRunId = PriorRunId,
            PriorGraphSnapshotId = PriorGraphSnapshotId,
            PriorGraphSnapshot = BuildPriorGraph(),
        };

        FindingsSnapshot snapshot = await harness.GenerateFindingsSnapshotAsync(
            RunId,
            ContextSnapshotId,
            current,
            CancellationToken.None,
            priorGraphFixture: priorFixture);

        List<Finding> allFindings = snapshot.Findings
            .Concat(snapshot.ChecklistCoverage)
            .ToList();

        allFindings.Select(static finding => finding.EngineType)
            .Should().Contain("requirement-cross-run-diff");
        allFindings.Select(static finding => finding.EngineType)
            .Should().Contain("topology-cross-run-diff");

        allFindings.Single(finding => finding.EngineType == "requirement-cross-run-diff")
            .Title.Should().Contain("regressed");
        allFindings.Single(finding => finding.EngineType == "topology-cross-run-diff")
            .Title.Should().Contain("regressed");
    }

    private static GraphSnapshot BuildCurrentGraph() =>
        new()
        {
            SchemaVersion = 1,
            GraphSnapshotId = CurrentGraphSnapshotId,
            ContextSnapshotId = ContextSnapshotId,
            RunId = RunId,
            CreatedUtc = new DateTime(2026, 9, 20, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                ContextNode("ctx-current"),
                RequirementNode("req-availability", "availability"),
                TopologyNode("sql-current", "database", GraphTopologyCategories.Data),
            ],
            Edges = [],
            Warnings = [],
        };

    private static GraphSnapshot BuildPriorGraph() =>
        new()
        {
            SchemaVersion = 1,
            GraphSnapshotId = PriorGraphSnapshotId,
            ContextSnapshotId = ContextSnapshotId,
            RunId = PriorRunId,
            CreatedUtc = new DateTime(2026, 9, 19, 12, 0, 0, DateTimeKind.Utc),
            Nodes =
            [
                ContextNode("ctx-prior"),
                RequirementNode("req-availability-prior", "availability"),
                RequirementNode("req-encryption-prior", "encryption"),
                TopologyNode("sql-prior", "database", GraphTopologyCategories.Datastore),
                TopologyNode("network-prior", "network", GraphTopologyCategories.Network),
            ],
            Edges = [],
            Warnings = [],
        };

    private static GraphNode ContextNode(string nodeId) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.ContextSnapshot,
            Label = "scope",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };

    private static GraphNode RequirementNode(string nodeId, string label) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.Requirement,
            Label = label,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };

    private static GraphNode TopologyNode(string nodeId, string label, string category) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase),
        };
}
