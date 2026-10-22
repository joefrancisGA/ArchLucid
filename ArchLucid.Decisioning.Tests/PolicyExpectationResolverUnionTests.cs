using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyExpectationResolverUnionTests
{
    [Fact]
    public void Topology_resolver_unions_identity_extra_and_keeps_default_pillars()
    {
        GraphSnapshot graph = CreateGraphWithPolicyTopologyExtra("identity");

        IReadOnlyList<string> expected = TopologyExpectedCategoryResolver.ResolveExpectedCategories(graph);

        expected.Should().Contain(GraphTopologyCategories.Identity);
        expected.Should().Contain(GraphTopologyCategories.Network);
        expected.Should().Contain(GraphTopologyCategories.Compute);
        expected.Should().Contain(GraphTopologyCategories.Storage);
        expected.Should().Contain(GraphTopologyCategories.Data);
    }

    [Fact]
    public void Security_family_resolver_unions_data_protection_extra()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new()
                    {
                        [ContextGraphPropertyKeys.PolicyExpectedSecurityControlFamilies] = "data-protection",
                    },
                },
            ],
        };

        IReadOnlyList<string> expected =
            WorkloadConditionedSecurityControlFamilyResolver.ResolveExpectedControlFamilies(graph);

        expected.Should().Contain("data-protection");
        expected.Should().Contain("identity-access");
        expected.Should().Contain("network-isolation");
        expected.Should().Contain("logging-monitoring");
    }

    private static GraphSnapshot CreateGraphWithPolicyTopologyExtra(string extraCategory)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new()
                    {
                        [ContextGraphPropertyKeys.PolicyExpectedTopologyCategories] = extraCategory,
                    },
                },
            ],
        };
    }
}
