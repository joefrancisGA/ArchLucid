using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class TopologyExpectedCategoryResolverTests
{
    [Fact]
    public void ResolveExpectedCategories_WhenNoContextNode_ReturnsDefaultPillars()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "api",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().Equal(
            GraphTopologyCategories.Network,
            GraphTopologyCategories.Compute,
            GraphTopologyCategories.Storage,
            GraphTopologyCategories.Data);
    }

    [Fact]
    public void ResolveExpectedCategories_WhenStaticSpaScope_OmitsStorageUnlessBlobMentioned()
    {
        GraphSnapshot graph = CreateGraphWithScope(requiredCapabilities: "Static SPA behind Front Door|HTTPS API");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().NotContain(GraphTopologyCategories.Storage);
        expected.Should().Contain(GraphTopologyCategories.Compute);
    }

    [Fact]
    public void ResolveExpectedCategories_WhenServerlessScope_OmitsNetworkUnlessPrivateNetworkingMentioned()
    {
        GraphSnapshot graph = CreateGraphWithScope(requiredCapabilities: "Azure Functions API");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().NotContain(GraphTopologyCategories.Network);
        expected.Should().Contain(GraphTopologyCategories.Compute);
    }

    [Fact]
    public void ResolveExpectedCategories_WhenIdentityCapability_AddsIdentityCategory()
    {
        GraphSnapshot graph = CreateGraphWithScope(requiredCapabilities: "Entra ID SSO|HTTPS API");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().Contain(GraphTopologyCategories.Identity);
    }

    private static GraphSnapshot CreateGraphWithScope(string requiredCapabilities)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "context",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = requiredCapabilities
                    }
                }
            ]
        };
    }
}
