using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologyAntiPatternFindingEngineTests
{
    [Fact]
    public async Task AnalyzeAsync_WhenDatastoreHasNoComputeDependency_EmitsGap()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "cmp-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                },
                new GraphNode
                {
                    NodeId = "ds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "sql",
                    Category = GraphTopologyCategories.Data,
                    Properties = new()
                }
            ]
        };

        TopologyAntiPatternFindingEngine sut = new();
        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().Contain(f => f.Title.Contains("no compute dependency", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_WhenLabelIsPublicStorage_EmitsPublicExposureFinding()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "st-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "public-storage-prod",
                    Category = GraphTopologyCategories.Data,
                    Properties = new(),
                },
            ],
        };

        TopologyAntiPatternFindingEngine sut = new();
        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().Contain(f => f.Title.Contains("publicly exposed", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_WhenLabelIsPublicNoSql_DoesNotEmitPublicExposureFinding()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "docdb-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "public-documentdb-nosql",
                    Category = GraphTopologyCategories.Data,
                    Properties = new(),
                },
            ],
        };

        TopologyAntiPatternFindingEngine sut = new();
        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotContain(f => f.Title.Contains("publicly exposed", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_WhenLabelIsNonPublicSql_StillDoesNotEmitPublicExposureFinding()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "non-public-sql-prod",
                    Category = GraphTopologyCategories.Data,
                    Properties = new(),
                },
            ],
        };

        TopologyAntiPatternFindingEngine sut = new();
        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, null, CancellationToken.None);

        findings.Should().NotContain(f => f.Title.Contains("publicly exposed", StringComparison.OrdinalIgnoreCase));
    }
}
