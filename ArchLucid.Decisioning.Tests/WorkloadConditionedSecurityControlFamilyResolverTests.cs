using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
public sealed class WorkloadConditionedSecurityControlFamilyResolverTests
{
    [Fact]
    public void ResolveExpectedControlFamilies_WhenDataWorkload_IncludesDataProtectionAndEncryption()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        [ContextGraphPropertyKeys.RequiredCapabilities] = "sql database"
                    }
                },
                new GraphNode
                {
                    NodeId = "data-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "db",
                    Category = GraphTopologyCategories.Data,
                    Properties = new()
                }
            ]
        };

        IReadOnlyList<string> families =
            WorkloadConditionedSecurityControlFamilyResolver.ResolveExpectedControlFamilies(graph);

        families.Should().Contain(SecurityControlFamilies.DataProtection);
        families.Should().Contain(SecurityControlFamilies.Encryption);
    }

    [Fact]
    public void ResolveControlFamily_WhenExplicitProperty_ReturnsValue()
    {
        GraphNode node = new()
        {
            NodeId = "sec-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "baseline",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["controlFamily"] = SecurityControlFamilies.LoggingMonitoring
            }
        };

        WorkloadConditionedSecurityControlFamilyResolver.ResolveControlFamily(node)
            .Should()
            .Be(SecurityControlFamilies.LoggingMonitoring);
    }

    [Fact]
    public void ResolveControlFamily_WhenControlIdSuggestsNetwork_ReturnsNetworkIsolation()
    {
        GraphNode node = new()
        {
            NodeId = "sec-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "Private endpoint enforcement",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["controlId"] = "network-private-link"
            }
        };

        WorkloadConditionedSecurityControlFamilyResolver.ResolveControlFamily(node)
            .Should()
            .Be(SecurityControlFamilies.NetworkIsolation);
    }
}
