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
    public void Apply_marks_target_and_hides_private_endpoint_node()
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
        ast.Nodes.Should().NotContain(node => string.Equals(node.Label, "pe-sql", StringComparison.Ordinal));

        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"private-endpoint-access\"");
        result.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        result.Svg.Should().Contain("class=\"private-endpoint-arrow\"");
        result.Svg.Should().Contain("Private endpoint access");
        result.Svg.Should().NotContain(">pe-sql<");
    }

    [Fact]
    public void Apply_marks_executive_target_when_private_endpoint_node_is_off_canvas()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-mysql";
        const string mysqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DBforMySQL/flexibleServers/mysql-bam-hi-dev";

        GraphSnapshot graph = BuildPrivateEndpointTargetGraph(
            peArmId,
            mysqlArmId,
            peNodeId: "pe-1",
            peLabel: "pe-mysql",
            targetNodeId: "mysql-1",
            targetLabel: "mysql-bam-hi-dev",
            targetArmType: "Microsoft.DBforMySQL/flexibleServers");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        DiagramNode? mysqlNode = ast.Nodes.FirstOrDefault(node =>
            string.Equals(node.Label, "mysql-bam-hi-dev", StringComparison.Ordinal));
        mysqlNode.Should().NotBeNull();
        mysqlNode!.HasPrivateEndpointAccess.Should().BeTrue();
        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/privateEndpoints", StringComparison.OrdinalIgnoreCase));

        DiagramForestLayoutResult result = renderer.Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().Contain("class=\"private-endpoint-access\"");
        result.Svg.Should().Contain("class=\"private-endpoint-lock\"");
        result.Svg.Should().Contain("class=\"private-endpoint-arrow\"");
        result.Svg.Should().Contain("Private endpoint access");
        result.Svg.Should().NotContain("class=\"edge-label\"");
    }

    [Fact]
    public void Apply_marks_child_when_private_endpoint_targets_parent_arm_id()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string serverArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql";
        const string databaseArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                BuildTopologyNode("pe-1", peArmId, "Microsoft.Network/privateEndpoints", "pe-sql"),
                BuildTopologyNode("sql-1", databaseArmId, "Microsoft.Sql/servers/databases", "app"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-pe-sql",
                    FromNodeId = "pe-1",
                    ToNodeId = "pe-target-server",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    Label = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    Weight = 1.0d,
                },
            ],
        };
        graph.Nodes.Add(BuildTopologyNode("pe-target-server", serverArmId, "Microsoft.Sql/servers", "sql"));

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Single(node => node.Label == "app").HasPrivateEndpointAccess.Should().BeTrue();
        ast.Nodes.Should().NotContain(node => node.Label == "pe-sql");
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
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "pe-sql", StringComparison.Ordinal));
        SvgShouldNotContainLock(ast);
    }

    private static void SvgShouldNotContainLock(DiagramAst ast)
    {
        DiagramForestLayoutResult result = new DiagramForestLayoutSvgRenderer().Render(ast);
        result.Succeeded.Should().BeTrue();
        result.Svg.Should().NotContain("class=\"private-endpoint-lock\"");
    }

    private static GraphSnapshot BuildPrivateEndpointTargetGraph(
        string peArmId,
        string targetArmId,
        string peNodeId = "pe-1",
        string peLabel = "pe-sql",
        string targetNodeId = "sql-1",
        string targetLabel = "app",
        string targetArmType = "Microsoft.Sql/servers/databases")
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                BuildTopologyNode(peNodeId, peArmId, "Microsoft.Network/privateEndpoints", peLabel),
                BuildTopologyNode(targetNodeId, targetArmId, targetArmType, targetLabel),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = $"edge-{peNodeId}-{targetNodeId}",
                    FromNodeId = peNodeId,
                    ToNodeId = targetNodeId,
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
