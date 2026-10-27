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
            edge.Label == "Role assignment: Reader. Observed use was not stored."
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
            .Contain(
                "Contributor on resource group rg. Observed use was not stored.");
    }

    [Fact]
    public void Apply_resource_group_assignment_labels_missing_resource_group_name()
    {
        DiagramAst ast = CreateAst();
        GraphSnapshot graph = new()
        {
            Nodes = [CreateNode("vm", "vm")],
            Edges =
            [
                CreateRoleEdge("vm", "resource-group", "/subscriptions/sub/resourceGroups//", "Contributor"),
            ],
        };

        InventoryDiagramRoleAccessApplier.Apply(
            ast,
            graph,
            new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm" });

        ast.Nodes.Single(node => node.NodeId == "vm").UnresolvedRelationshipDetails.Should()
            .Contain(
                "Contributor on resource group Resource group name was stored empty. Observed use was not stored.");
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
            .Contain(
                "Reader at subscription scope (subscription id sub). Subscription name was not stored. Observed use was not stored.");
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
            .Contain("Role name was not stored. Scope is subscription id sub. Subscription name was not stored.");
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

    [Fact]
    public void Apply_multiple_resource_roles_summarizes_access_without_mutating_assignment_evidence()
    {
        DiagramAst ast = CreateAst();
        ast.Edges = [new() { FromNodeId = "vm", ToNodeId = "vault", Label = "has role", InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment },
            new() { FromNodeId = "vm", ToNodeId = "vault", Label = "has role", InferenceSource = GraphEdgeInferenceSources.InventoryRbacAssignment }];
        GraphSnapshot graph = new() { Edges = [CreateRoleEdge("vm", "vault", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault", "Reader"),
            CreateRoleEdge("vm", "vault", "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/vault", "Owner")] };
        var mapping = new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm", ["vault"] = "vault" };
        InventoryDiagramRoleAccessApplier.Apply(ast, graph, mapping);
        InventoryDiagramRoleAccessApplier.Apply(ast, graph, mapping);
        ast.Edges.Should().ContainSingle().Which.Label.Should()
            .Be("Role names were not listed on this line.");
        graph.Edges.Should().HaveCount(2);
        graph.Edges.Select(edge => edge.Properties["roleName"]).Should().BeEquivalentTo("Reader", "Owner");
    }

    [Fact]
    public void Apply_multiple_subscription_roles_retains_each_outline_detail()
    {
        DiagramAst ast = CreateAst();
        GraphSnapshot graph = new() { Edges = [CreateRoleEdge("vm", "subscription", "/subscriptions/sub", "Reader"),
            CreateRoleEdge("vm", "subscription", "/subscriptions/sub", "Owner")] };
        var mapping = new Dictionary<string, string>(StringComparer.Ordinal) { ["vm"] = "vm" };
        InventoryDiagramRoleAccessApplier.Apply(ast, graph, mapping);
        InventoryDiagramRoleAccessApplier.Apply(ast, graph, mapping);
        ast.Edges.Should().BeEmpty();
        ast.Nodes.Single(node => node.NodeId == "vm").UnresolvedRelationshipDetails.Should()
            .BeEquivalentTo(
                "Reader at subscription scope (subscription id sub). Subscription name was not stored. Observed use was not stored.",
                "Owner at subscription scope (subscription id sub). Subscription name was not stored. Observed use was not stored.");
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
