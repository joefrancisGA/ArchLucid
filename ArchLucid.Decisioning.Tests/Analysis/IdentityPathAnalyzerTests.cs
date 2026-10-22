using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class IdentityPathAnalyzerTests
{
    [Fact]
    public void Analyze_emits_path_for_actor_contributor_keyvault_fixture()
    {
        GraphSnapshot graph = BuildActorContributorKeyVaultFixture(includeRoleEdge: true);

        IReadOnlyList<IdentityBlastRadiusPath> paths = IdentityPathAnalyzer.Analyze(graph);

        IdentityBlastRadiusPath path = paths.Should().ContainSingle().Subject;
        path.ActorLabel.Should().Be("checkout-func");
        path.DatastoreLabel.Should().Be("kv-pay-prod");
        path.RoleName.Should().Be("Contributor");
        path.HopCount.Should().Be(2);
    }

    [Fact]
    public void Analyze_emits_none_when_role_assignment_edge_missing()
    {
        GraphSnapshot graph = BuildActorContributorKeyVaultFixture(includeRoleEdge: false);

        IdentityPathAnalyzer.Analyze(graph).Should().BeEmpty();
    }

    [Fact]
    public void Analyze_skips_unknown_role_names()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                BuildMachineActor("actor-checkout", "checkout-func"),
                new GraphNode
                {
                    NodeId = "role-custom",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "custom-role",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["terraformType"] = "azurerm_role_assignment",
                        ["roleName"] = "CustomReaderWriter",
                    },
                },
                BuildKeyVault("kv-pay-prod", "kv-pay-prod"),
            ],
            Edges =
            [
                BuildEdge("actor-checkout", "role-custom"),
                BuildEdge("role-custom", "kv-pay-prod"),
            ],
        };

        IdentityPathAnalyzer.Analyze(graph).Should().BeEmpty();
    }

    [Fact]
    public void Analyze_includes_regulated_datastore_exactly_at_hop_cap()
    {
        // DX-06 bounds the blast-radius walk to 8 hops. The cap is inclusive: the datastore
        // on the eighth edge is still in range. The trust-boundary walk uses that same bound.
        GraphSnapshot graph = BuildContributorChain(IdentityPathAnalyzer.MaxHopCount);

        IReadOnlyList<IdentityBlastRadiusPath> paths = IdentityPathAnalyzer.Analyze(graph);

        IdentityBlastRadiusPath path = paths.Should().ContainSingle().Subject;
        path.DatastoreLabel.Should().Be("kv-pay-prod");
        path.RoleName.Should().Be("Contributor");
        path.HopCount.Should().Be(IdentityPathAnalyzer.MaxHopCount);
    }

    [Fact]
    public void Analyze_excludes_regulated_datastore_past_hop_cap()
    {
        GraphSnapshot graph = BuildContributorChain(IdentityPathAnalyzer.MaxHopCount + 1);

        IdentityPathAnalyzer.Analyze(graph).Should().BeEmpty();
    }

    [Fact]
    public void Analyze_null_graph_nodes_does_not_throw()
    {
        GraphSnapshot graph = new() { Nodes = null!, Edges = null! };

        IdentityPathAnalyzer.Analyze(graph).Should().BeEmpty();
    }

    private static GraphSnapshot BuildActorContributorKeyVaultFixture(bool includeRoleEdge)
    {
        GraphNode actor = BuildMachineActor("actor-checkout", "checkout-func");
        GraphNode roleAssignment = new()
        {
            NodeId = "role-contrib-kv",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-contributor-kv",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
            },
        };
        GraphNode keyVault = BuildKeyVault("kv-pay-prod", "kv-pay-prod");

        List<GraphEdge> edges =
        [
            BuildEdge(actor.NodeId, roleAssignment.NodeId),
        ];

        if (includeRoleEdge)
        {
            edges.Add(BuildEdge(roleAssignment.NodeId, keyVault.NodeId));
        }

        return new GraphSnapshot
        {
            Nodes = [actor, roleAssignment, keyVault],
            Edges = edges,
        };
    }

    private static GraphSnapshot BuildContributorChain(int datastoreHopCount)
    {
        List<GraphNode> nodes = [];
        List<GraphEdge> edges = [];
        GraphNode actor = BuildMachineActor("actor-checkout", "checkout-func");
        nodes.Add(actor);
        string previousId = actor.NodeId;

        for (int hop = 1; hop <= datastoreHopCount; hop++)
        {
            GraphNode node = hop == datastoreHopCount
                ? BuildKeyVault("kv-pay-prod", "kv-pay-prod")
                : hop == 1
                    ? BuildContributorRole("role-contrib")
                    : new GraphNode
                    {
                        NodeId = $"hop-{hop}",
                        NodeType = GraphNodeTypes.TopologyResource,
                        Label = $"link-{hop}",
                    };

            nodes.Add(node);
            edges.Add(BuildEdge(previousId, node.NodeId));
            previousId = node.NodeId;
        }

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges = edges,
        };
    }

    private static GraphNode BuildContributorRole(string nodeId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "checkout-contributor-kv",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_role_assignment",
                ["roleName"] = "Contributor",
            },
        };
    }

    private static GraphNode BuildMachineActor(string nodeId, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.Actor,
            Label = label,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["kind"] = nameof(ActorKind.Machine),
                ["trustOrigin"] = nameof(TrustOrigin.Internal),
            },
        };
    }

    private static GraphNode BuildKeyVault(string nodeId, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Storage,
                [CanonicalGraphPropertyKeys.TopologySensitivity] = TopologySensitivityLevels.DataBearing,
            },
        };
    }

    private static GraphEdge BuildEdge(string fromNodeId, string toNodeId)
    {
        return new GraphEdge
        {
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Weight = 1.0,
        };
    }
}
