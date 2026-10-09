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

    [Fact]
    public void ResolveExpectedCategories_does_not_treat_workspace_capability_as_static_spa()
    {
        GraphSnapshot graph = CreateGraphWithScope(requiredCapabilities: "log analytics workspace");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().Contain(GraphTopologyCategories.Storage);
    }

    [Fact]
    public void ResolveExpectedCategories_does_not_treat_restore_capability_as_rest_api()
    {
        GraphSnapshot graph = CreateGraphWithScope(requiredCapabilities: "point-in-time restore");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().Contain(GraphTopologyCategories.Data);
    }

    [Fact]
    public void ResolveExpectedCategories_keeps_data_when_api_scope_names_postgresql_or_nosql()
    {
        GraphSnapshot postgresql = CreateGraphWithScope(requiredCapabilities: "https api|postgresql");
        GraphSnapshot nosql = CreateGraphWithScope(requiredCapabilities: "https api|nosql");

        TopologyExpectedCategoryResolver.ResolveExpectedCategories(postgresql)
            .Should().Contain(GraphTopologyCategories.Data);
        TopologyExpectedCategoryResolver.ResolveExpectedCategories(nosql)
            .Should().Contain(GraphTopologyCategories.Data);
    }

    [Fact]
    public void ResolveExpectedCategories_keeps_network_when_functions_scope_names_private_networking()
    {
        GraphSnapshot graph = CreateGraphWithScope(requiredCapabilities: "azure functions|private networking");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().Contain(GraphTopologyCategories.Network);
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
