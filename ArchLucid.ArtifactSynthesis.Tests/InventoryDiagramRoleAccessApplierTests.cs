using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramRoleAccessApplierTests
{
    [Fact]
    public void Apply_resource_scoped_assignment_draws_solid_has_access_line()
    {
        DiagramAst ast = CreateAst();
        GraphSnapshot graph = new()
        {
            Nodes = [CreateNode("vm", "vm"), CreateNode("vault", "vault")],
            Edges =
            [
                CreateRoleEdge("vm", "vault", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault", "Reader"),
            ],
        };

        InventoryDiagramRoleAccessApplier.Apply(
            ast,
            graph,
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["vm"] = "vm",
                ["vault"] = "vault",
            });

        ast.Edges.Should().ContainSingle(edge =>
            edge.Label == InventoryDiagramRelationshipLabelTexts.HasAccess
            && edge.ProvenanceKind == ProvenanceKind.ObservedFact.ToString());
    }

    [Fact]
    public void Apply_resource_group_assignment_adds_outline_only()
    {
        DiagramAst ast = CreateAst();
        GraphSnapshot graph = new()
        {
            Nodes = [CreateNode("vm", "vm")],
            Edges =
            [
                CreateRoleEdge("vm", "resource-group", "/subscriptions/sub/resourceGroups/rg", "Contributor"),
            ],
        };

        InventoryDiagramRoleAccessApplier.Apply(
            ast,
            graph,
            new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm" });

        ast.Edges.Should().BeEmpty();
        ast.Nodes.Single(node => node.NodeId == "vm").UnresolvedRelationshipDetails.Should()
            .Contain("Has Contributor on resource group rg");
    }

    [Fact]
    public void Apply_subscription_assignment_adds_subscription_outline_only()
    {
        DiagramAst ast = CreateAst();
        GraphSnapshot graph = new()
        {
            Nodes = [CreateNode("vm", "vm")],
            Edges =
            [
                CreateRoleEdge("vm", "subscription", "/subscriptions/sub", "Reader"),
            ],
        };

        InventoryDiagramRoleAccessApplier.Apply(
            ast,
            graph,
            new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm" });

        ast.Edges.Should().BeEmpty();
        ast.Nodes.Single(node => node.NodeId == "vm").UnresolvedRelationshipDetails.Should()
            .Contain("Has Reader on this subscription");
    }

    [Fact]
    public void Apply_role_assignment_without_stored_role_name_uses_omission_copy()
    {
        DiagramAst ast = CreateAst();
        GraphEdge edge = CreateRoleEdge(
            "vm",
            "subscription",
            "/subscriptions/sub",
            "Reader");
        edge.Properties.Remove("roleName");

        InventoryDiagramRoleAccessApplier.Apply(
            ast,
            new GraphSnapshot { Nodes = [CreateNode("vm", "vm")], Edges = [edge] },
            new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm" });

        ast.Nodes.Single(node => node.NodeId == "vm").UnresolvedRelationshipDetails.Should()
            .Contain("Has Role name was not stored. on this subscription");
    }

    [Fact]
    public void Apply_without_role_edges_does_nothing()
    {
        DiagramAst ast = CreateAst();

        InventoryDiagramRoleAccessApplier.Apply(
            ast,
            new GraphSnapshot { Nodes = [CreateNode("vm", "vm")] },
            new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm" });

        ast.Edges.Should().BeEmpty();
        ast.Nodes.Single(node => node.NodeId == "vm").UnresolvedRelationshipDetails.Should().BeEmpty();
    }

    private static DiagramAst CreateAst()
    {
        return new DiagramAst
        {
            Nodes =
            [
                new DiagramNode { NodeId = "vm", Label = "vm" },
                new DiagramNode { NodeId = "vault", Label = "vault" },
            ],
        };
    }

    private static GraphNode CreateNode(string nodeId, string label)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
        };
    }

    private static GraphEdge CreateRoleEdge(string fromNodeId, string toNodeId, string scope, string roleName)
    {
        return new GraphEdge
        {
            EdgeId = $"{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.HasRole,
            InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["scope"] = scope,
                ["roleName"] = roleName,
            },
        };
    }
}
