using ArchiForge.Decisioning.Analysis;
using ArchiForge.Decisioning.Findings;
using ArchiForge.Decisioning.Findings.Payloads;
using ArchiForge.Decisioning.Models;
using ArchiForge.Decisioning.Services;
using ArchiForge.KnowledgeGraph.Models;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

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
    }

    [Fact]
    public async Task AnalyzeAsync_WhenCategoriesMissing_EmitsIncompleteCoverageFinding()
    {
        TopologyCoverageResult coverage = new()
        {
            TopologyNodeCount = 3,
            PresentCategories = ["network"],
            MissingCategories = ["storage"],
        };

        Mock<IGraphCoverageAnalyzer> analyzer = new();
        analyzer.Setup(x => x.AnalyzeTopology(It.IsAny<GraphSnapshot>())).Returns(coverage);

        TopologyCoverageFindingEngine sut = new(analyzer.Object);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        TopologyCoverageFindingPayload? payload = findings[0].Payload as TopologyCoverageFindingPayload;
        payload.Should().NotBeNull();
        payload!.MissingCategories.Should().Contain("storage");
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
