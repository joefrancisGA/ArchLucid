using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Findings.Payloads;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Topology Coverage Finding Engine.
/// </summary>

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopologyCoverageFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_WhenTopologyNodeCountIsZero_EmitsMissingTopologyFinding()
    {
        TopologyCoverageResult coverage = new() { TopologyNodeCount = 0, PresentCategories = [] };

        Mock<IGraphCoverageAnalyzer> analyzer = new();
        analyzer.Setup(x => x.AnalyzeTopology(It.IsAny<GraphSnapshot>())).Returns(coverage);

        TopologyCoverageFindingEngine sut = new(analyzer.Object);
        GraphSnapshot graph = new();

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        Finding finding = findings[0];
        finding.FindingType.Should().Be(FindingTypes.TopologyCoverageFinding);
        finding.Title.Should().Contain("No topology");
        finding.Trace.DecisionsTaken.Should().NotBeEmpty();
        finding.Trace.RulesApplied.Should().Contain("topology-coverage-presence");
        finding.Trace.Notes.Should().NotBeEmpty();
        finding.Trace.AlternativePathsConsidered.Should().HaveCount(3);
    }

    [Fact]
    public async Task AnalyzeAsync_WhenCategoriesMissing_EmitsIncompleteCoverageFinding()
    {
        TopologyCoverageResult coverage = new()
        {
            TopologyNodeCount = 3,
            PresentCategories = ["network"],
            MissingCategories = ["storage"],
            TopologyNodeIds = ["topo-a", "topo-b", "topo-c"],
        };

        Mock<IGraphCoverageAnalyzer> analyzer = new();
        analyzer.Setup(x => x.AnalyzeTopology(It.IsAny<GraphSnapshot>())).Returns(coverage);

        TopologyCoverageFindingEngine sut = new(analyzer.Object);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        TopologyCoverageFindingPayload? payload = findings[0].Payload as TopologyCoverageFindingPayload;
        payload.Should().NotBeNull();
        payload.MissingCategories.Should().Contain("storage");
        findings[0].Trace.DecisionsTaken.Should().NotBeEmpty();
        findings[0].Trace.RulesApplied.Should().Contain("topology-coverage-categories");
        findings[0].Trace.GraphNodeIdsExamined.Should().Equal("topo-a", "topo-b", "topo-c");
        findings[0].Trace.Notes.Should().Contain(n => n.StartsWith("Present:", StringComparison.Ordinal));
        findings[0].Trace.Notes.Should().Contain(n => n.StartsWith("Missing:", StringComparison.Ordinal));
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(3);
    }

    [Fact]
    public async Task AnalyzeAsync_WhenCoverageComplete_ReturnsNoFindings()
    {
        TopologyCoverageResult coverage = new()
        {
            TopologyNodeCount = 4,
            PresentCategories = ["network", "compute", "storage", "data"],
            MissingCategories = [],
        };

        Mock<IGraphCoverageAnalyzer> analyzer = new();
        analyzer.Setup(x => x.AnalyzeTopology(It.IsAny<GraphSnapshot>())).Returns(coverage);

        TopologyCoverageFindingEngine sut = new(analyzer.Object);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }
}
