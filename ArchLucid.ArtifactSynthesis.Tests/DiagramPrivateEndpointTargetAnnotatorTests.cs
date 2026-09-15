using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramPrivateEndpointTargetAnnotatorTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void Apply_marks_target_and_clears_private_endpoint_edge_label()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string sqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";

        GraphSnapshot graph = BuildPrivateEndpointTargetGraph(peArmId, sqlArmId);
        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode? sqlNode = ast.Nodes.FirstOrDefault(node => string.Equals(node.Label, "app", StringComparison.Ordinal));
        sqlNode.Should().NotBeNull();
        sqlNode!.HasPrivateEndpointAccess.Should().BeTrue();

        DiagramEdge? peEdge = ast.Edges.FirstOrDefault(edge =>
            string.Equals(edge.FromNodeId, ast.Nodes.Single(node => node.Label == "pe-sql").NodeId, StringComparison.Ordinal)
            && string.Equals(edge.ToNodeId, sqlNode.NodeId, StringComparison.Ordinal));
        peEdge.Should().NotBeNull();
        peEdge!.Label.Should().BeEmpty();

        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        result.Svg.Should().Contain("Private endpoint access");
        result.Svg.Should().NotContain("class=\"edge-label\"");
    }

    [Fact]
    public void Apply_does_not_mark_subnet_for_pe_to_subnet_attachment()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/data";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                BuildTopologyNode("pe-1", peArmId, "Microsoft.Network/privateEndpoints", "pe-sql"),
                BuildTopologyNode("subnet-1", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "data"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-pe-subnet",
                    FromNodeId = "pe-1",
                    ToNodeId = "subnet-1",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    Label = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    InferenceSource = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    Weight = 1.0d,
                },
            ],
        };

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode? subnetNode = ast.Nodes.FirstOrDefault(node => string.Equals(node.Label, "data", StringComparison.Ordinal));
        subnetNode.Should().NotBeNull();
        subnetNode!.HasPrivateEndpointAccess.Should().BeFalse();
        SvgShouldNotContainLock(ast);
    }

    private static void SvgShouldNotContainLock(DiagramAst ast)
    {
        DiagramForestLayoutResult result = new DiagramForestLayoutSvgRenderer().Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotContain("class=\"private-endpoint-lock\"");
    }

    private static GraphSnapshot BuildPrivateEndpointTargetGraph(string peArmId, string targetArmId)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                BuildTopologyNode("pe-1", peArmId, "Microsoft.Network/privateEndpoints", "pe-sql"),
                BuildTopologyNode("sql-1", targetArmId, "Microsoft.Sql/servers/databases", "app"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-pe-sql",
                    FromNodeId = "pe-1",
                    ToNodeId = "sql-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    Weight = 1.0d,
                },
            ],
        };
    }

    private static GraphNode BuildTopologyNode(string nodeId, string armId, string armType, string label)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
        };
        node.Properties["arm.id"] = armId;
        node.Properties["arm.type"] = armType;
        node.Properties["arm.resourceGroup"] = "rg";
        node.Properties["arm.subscriptionId"] = "sub";

        return node;
    }
}
