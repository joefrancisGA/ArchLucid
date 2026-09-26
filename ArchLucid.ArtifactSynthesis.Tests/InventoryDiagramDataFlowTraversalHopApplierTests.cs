using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowTraversalHopApplierTests
{
    private const string FrontDoorArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/frontDoors/fd";

    private const string AgwArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/applicationGateways/agw";

    private const string FirewallArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw";

    private const string LoadBalancerArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb";

    private const string AppArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app";

    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st";

    private const string PrivateEndpointArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe";

    private const string NsgArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_data_flow_chains_front_door_application_gateway_and_firewall_in_order()
    {
        GraphSnapshot graph = BuildIngressChainGraph(
            includeAgwToApp: true,
            includeFrontDoorToApp: true,
            includeFirewallToApp: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Nodes.Select(node => node.ArmResourceId).Should().BeEquivalentTo(
            FrontDoorArmId,
            AgwArmId,
            FirewallArmId,
            AppArmId);

        string frontDoorId = ast.Nodes.Single(node => node.ArmResourceId == FrontDoorArmId).NodeId;
        string agwId = ast.Nodes.Single(node => node.ArmResourceId == AgwArmId).NodeId;
        string firewallId = ast.Nodes.Single(node => node.ArmResourceId == FirewallArmId).NodeId;
        string appId = ast.Nodes.Single(node => node.ArmResourceId == AppArmId).NodeId;

        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == frontDoorId && edge.ToNodeId == agwId);
        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == agwId && edge.ToNodeId == firewallId);
        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == firewallId && edge.ToNodeId == appId);
        ast.Edges.Should().NotContain(edge => !edge.IsLayoutOnly && edge.FromNodeId == frontDoorId && edge.ToNodeId == appId);
    }

    [Fact]
    public void Compile_data_flow_places_load_balancer_between_application_gateway_and_app()
    {
        GraphSnapshot graph = BuildLoadBalancerGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        string agwId = ast.Nodes.Single(node => node.ArmResourceId == AgwArmId).NodeId;
        string lbId = ast.Nodes.Single(node => node.ArmResourceId == LoadBalancerArmId).NodeId;
        string appId = ast.Nodes.Single(node => node.ArmResourceId == AppArmId).NodeId;

        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == agwId && edge.ToNodeId == lbId);
        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == lbId && edge.ToNodeId == appId);
    }

    [Fact]
    public void Compile_data_flow_places_private_endpoint_between_app_and_storage()
    {
        GraphSnapshot graph = BuildPrivateEndpointGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.DataFlow,
            new DiagramAstCompileOptions { IncludePrivateEndpointNodes = true });

        string appId = ast.Nodes.Single(node => node.ArmResourceId == AppArmId).NodeId;
        string peId = ast.Nodes.Single(node => node.ArmResourceId == PrivateEndpointArmId).NodeId;
        string storageId = ast.Nodes.Single(node => node.ArmResourceId == StorageArmId).NodeId;

        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == appId && edge.ToNodeId == peId);
        ast.Edges.Should().Contain(edge => !edge.IsLayoutOnly && edge.FromNodeId == peId && edge.ToNodeId == storageId);
        ast.Edges.Should().NotContain(edge => !edge.IsLayoutOnly && edge.FromNodeId == appId && edge.ToNodeId == storageId);
    }

    [Fact]
    public void Compile_data_flow_preserves_direct_connector_when_private_endpoint_is_hidden()
    {
        GraphSnapshot graph = BuildPrivateEndpointGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == PrivateEndpointArmId);

        string appId = ast.Nodes.Single(node => node.ArmResourceId == AppArmId).NodeId;
        string storageId = ast.Nodes.Single(node => node.ArmResourceId == StorageArmId).NodeId;

        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.FromNodeId == appId
            && edge.ToNodeId == storageId);
    }

    [Fact]
    public void Compile_data_flow_does_not_include_nsg_as_traversal_hop()
    {
        GraphSnapshot graph = BuildNsgGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == NsgArmId);
    }

    [Fact]
    public void Compile_data_flow_missing_intermediate_hop_does_not_bridge_gap()
    {
        GraphSnapshot graph = BuildIngressChainGraph(
            includeAgwToApp: false,
            includeFrontDoorToApp: true,
            includeFirewallToApp: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        string frontDoorId = ast.Nodes.Single(node => node.ArmResourceId == FrontDoorArmId).NodeId;
        string appId = ast.Nodes.Single(node => node.ArmResourceId == AppArmId).NodeId;
        DiagramNode firewallNode = ast.Nodes.Single(node => node.ArmResourceId == FirewallArmId);

        ast.Edges.Should().NotContain(edge => !edge.IsLayoutOnly && edge.FromNodeId == frontDoorId && edge.ToNodeId == appId);
        firewallNode.UnresolvedRelationshipDetails.Should().Contain(detail => detail.Contains("missing hop after fw", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_data_flow_preserves_avd_isolation_for_session_host_vm()
    {
        GraphSnapshot graph = BuildAvdWithIngressGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Nodes.Should().NotContain(node =>
            node.ArmResourceId != null
            && node.ArmResourceId.Contains("DesktopVirtualization", StringComparison.Ordinal));
        ast.Nodes.Should().NotContain(node =>
            node.ArmResourceId != null
            && node.ArmResourceId.Contains("virtualMachines/avd", StringComparison.Ordinal));
    }

    private static GraphSnapshot BuildIngressChainGraph(
        bool includeAgwToApp,
        bool includeFrontDoorToApp,
        bool includeFirewallToApp)
    {
        List<GraphNode> nodes =
        [
            CreateNode("fd-node", FrontDoorArmId, "Microsoft.Network/frontDoors"),
            CreateNode("agw-node", AgwArmId, "Microsoft.Network/applicationGateways"),
            CreateNode("fw-node", FirewallArmId, "Microsoft.Network/azureFirewalls"),
            CreateNode("app-node", AppArmId, "Microsoft.Web/sites"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("fd-node", "agw-node", AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin, GraphEdgeInferenceSources.InventoryFrontDoorOrigin),
            CreateEdge("agw-node", "fw-node", AzureInventoryRelationshipAssociationTypes.AgwToBackend, GraphEdgeInferenceSources.InventoryAgwBackend),
        ];

        if (includeFirewallToApp)
        {
            edges.Add(CreateEdge(
                "fw-node",
                "app-node",
                AzureInventoryRelationshipAssociationTypes.FirewallToSubnet,
                GraphEdgeInferenceSources.InventoryFirewallSubnet));
        }

        if (includeAgwToApp)
        {
            edges.Add(CreateEdge(
                "agw-node",
                "app-node",
                AzureInventoryRelationshipAssociationTypes.AgwToBackend,
                GraphEdgeInferenceSources.InventoryAgwBackend));
        }

        if (includeFrontDoorToApp)
        {
            edges.Add(CreateEdge(
                "fd-node",
                "app-node",
                AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin,
                GraphEdgeInferenceSources.InventoryFrontDoorOrigin));
        }

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildLoadBalancerGraph()
    {
        List<GraphNode> nodes =
        [
            CreateNode("agw-node", AgwArmId, "Microsoft.Network/applicationGateways"),
            CreateNode("lb-node", LoadBalancerArmId, "Microsoft.Network/loadBalancers"),
            CreateNode("app-node", AppArmId, "Microsoft.Web/sites"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("agw-node", "lb-node", AzureInventoryRelationshipAssociationTypes.AgwToBackend, GraphEdgeInferenceSources.InventoryAgwBackend),
            CreateEdge("lb-node", "app-node", AzureInventoryRelationshipAssociationTypes.LbToBackend, GraphEdgeInferenceSources.InventoryLbBackend),
            CreateEdge("agw-node", "app-node", AzureInventoryRelationshipAssociationTypes.AgwToBackend, GraphEdgeInferenceSources.InventoryAgwBackend),
        ];

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildPrivateEndpointGraph()
    {
        List<GraphNode> nodes =
        [
            CreateNode("app-node", AppArmId, "Microsoft.Web/sites"),
            CreateNode("pe-node", PrivateEndpointArmId, "Microsoft.Network/privateEndpoints"),
            CreateNode("storage-node", StorageArmId, "Microsoft.Storage/storageAccounts"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("app-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PeReachableTarget, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            CreateEdge("pe-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            CreateEdge("pe-node", "app-node", AzureInventoryRelationshipAssociationTypes.PeToSubnet, GraphEdgeInferenceSources.InventoryPeSubnet),
        ];

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildNsgGraph()
    {
        List<GraphNode> nodes =
        [
            CreateNode("nsg-node", NsgArmId, "Microsoft.Network/networkSecurityGroups"),
            CreateNode("app-node", AppArmId, "Microsoft.Web/sites"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("nsg-node", "app-node", AzureInventoryRelationshipAssociationTypes.SubnetToNsg, GraphEdgeInferenceSources.InventorySubnetNsg),
        ];

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildAvdWithIngressGraph()
    {
        const string hostPoolArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool";

        const string avdVmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01";

        List<GraphNode> nodes =
        [
            CreateNode("host-pool-node", hostPoolArmId, "Microsoft.DesktopVirtualization/hostPools"),
            CreateNode("avd-vm-node", avdVmArmId, "Microsoft.Compute/virtualMachines"),
            CreateNode("fd-node", FrontDoorArmId, "Microsoft.Network/frontDoors"),
            CreateNode("app-node", AppArmId, "Microsoft.Web/sites"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("host-pool-node", "avd-vm-node", AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm, GraphEdgeInferenceSources.InventoryAvdSessionHostToVm),
            CreateEdge("fd-node", "app-node", AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin, GraphEdgeInferenceSources.InventoryFrontDoorOrigin),
        ];

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot CreateGraph(IReadOnlyList<GraphNode> nodes, IReadOnlyList<GraphEdge> edges)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes.ToList(),
            Edges = edges.ToList(),
        };
    }

    private static GraphEdge CreateEdge(
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource)
    {
        return new GraphEdge
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1,
            InferenceSource = inferenceSource,
        };
    }

    private static GraphNode CreateNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId[(armId.LastIndexOf('/') + 1)..],
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg",
            },
        };
    }
}
