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
