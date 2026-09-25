using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowTraversalHopProjectorTests
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

    [Fact]
    public void ProjectPath_orders_front_door_application_gateway_and_firewall_hops()
    {
        GraphSnapshot graph = BuildIngressChainGraph(includeAgwToApp: true, includeFirewallToApp: true);
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "fd-node",
            "app-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().Equal("agw-node", "fw-node");
        path.OrderedLinks.Select(link => link.FromNodeId).Should().Equal("fd-node", "agw-node", "fw-node");
        path.HasUnresolvedGap.Should().BeFalse();
    }

    [Fact]
    public void ProjectPath_places_load_balancer_between_inbound_hop_and_backend()
    {
        GraphSnapshot graph = BuildLoadBalancerGraph();
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "agw-node",
            "app-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().Equal("lb-node");
        path.OrderedLinks.Select(link => link.ToNodeId).Should().Equal("lb-node", "app-node");
    }

    [Fact]
    public void ProjectPath_places_private_endpoint_between_consumer_and_paas_target()
    {
        GraphSnapshot graph = BuildPrivateEndpointGraph();
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "app-node",
            "storage-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().Equal("pe-node");
        path.OrderedLinks.Select(link => link.ToNodeId).Should().Equal("pe-node", "storage-node");
    }

    [Fact]
    public void ProjectPath_places_private_endpoint_between_vm_consumer_and_paas_target_when_attached_via_nic()
    {
        GraphSnapshot graph = BuildPrivateEndpointViaNicGraph(useInferenceSourceOnlyVmNic: false);
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "vm-node",
            "storage-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().Equal("pe-node");
        path.OrderedLinks.Select(link => link.ToNodeId).Should().Equal("pe-node", "storage-node");
    }

    [Fact]
    public void ProjectPath_places_private_endpoint_between_vm_consumer_and_paas_target_when_vm_nic_is_inference_only()
    {
        GraphSnapshot graph = BuildPrivateEndpointViaNicGraph(useInferenceSourceOnlyVmNic: true);
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "vm-node",
            "storage-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().Equal("pe-node");
        path.OrderedLinks.Select(link => link.ToNodeId).Should().Equal("pe-node", "storage-node");
    }

    [Fact]
    public void ProjectPath_places_private_endpoint_between_vm_consumer_and_paas_target_when_vm_nic_shares_private_endpoint_subnet()
    {
        GraphSnapshot graph = BuildPrivateEndpointViaVmSubnetGraph();
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "vm-node",
            "storage-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().Equal("pe-node");
        path.OrderedLinks.Select(link => link.ToNodeId).Should().Equal("pe-node", "storage-node");
    }

    [Fact]
    public void ProjectPath_does_not_place_private_endpoint_when_consumer_nic_uses_different_subnet()
    {
        GraphSnapshot graph = BuildPrivateEndpointDifferentSubnetGraph();
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "nic-node",
            "storage-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.OrderedHopNodeIds.Should().BeEmpty();
        path.OrderedLinks.Should().BeEmpty();
        path.ReachesTarget.Should().BeFalse();
    }

    [Fact]
    public void CollectTraversalLinks_ignores_nsg_associations()
    {
        GraphSnapshot graph = BuildNsgGraph();
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        links.Should().BeEmpty();
        InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopArmType("Microsoft.Network/networkSecurityGroups")
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ProjectPath_records_missing_intermediate_hop_without_bridging_gap()
    {
        GraphSnapshot graph = BuildIngressChainGraph(includeAgwToApp: false, includeFirewallToApp: false);
        IReadOnlyList<InventoryDiagramDataFlowTraversalHopLink> links =
            InventoryDiagramDataFlowTraversalHopProjector.CollectTraversalLinks(graph);

        InventoryDiagramDataFlowTraversalHopPath path = InventoryDiagramDataFlowTraversalHopProjector.ProjectPath(
            "fd-node",
            "app-node",
            links,
            graph.Nodes.ToDictionary(node => node.NodeId, StringComparer.Ordinal));

        path.HasUnresolvedGap.Should().BeTrue();
        path.OrderedHopNodeIds.Should().Equal("agw-node", "fw-node");
        path.ReachesTarget.Should().BeFalse();
        path.MissingHopDescription.Should().Contain("missing hop after fw");
    }

    private static GraphSnapshot BuildIngressChainGraph(bool includeAgwToApp, bool includeFirewallToApp)
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
        ];

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildPrivateEndpointViaVmSubnetGraph()
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/private-endpoint-subnet";

        List<GraphNode> nodes =
        [
            CreateNode("vm-node", vmArmId, "Microsoft.Compute/virtualMachines"),
            CreateNode("nic-node", nicArmId, "Microsoft.Network/networkInterfaces"),
            CreateNode("pe-node", PrivateEndpointArmId, "Microsoft.Network/privateEndpoints"),
            CreateNode("storage-node", StorageArmId, "Microsoft.Storage/storageAccounts"),
            CreateNode("subnet-node", subnetArmId, "Microsoft.Network/virtualNetworks/subnets"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("vm-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PeReachableTarget, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            CreateEdge("pe-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            CreateEdge("pe-node", "subnet-node", AzureInventoryRelationshipAssociationTypes.PeToSubnet, GraphEdgeInferenceSources.InventoryPeSubnet),
            CreateEdge("vm-node", "nic-node", AzureInventoryRelationshipAssociationTypes.VmToNic, GraphEdgeInferenceSources.InventoryVmNic),
            CreateEdge("nic-node", "subnet-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet, GraphEdgeInferenceSources.InventoryNicSubnet),
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

    private static GraphSnapshot BuildPrivateEndpointViaNicGraph(bool useInferenceSourceOnlyVmNic)
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic";

        List<GraphNode> nodes =
        [
            CreateNode("vm-node", vmArmId, "Microsoft.Compute/virtualMachines"),
            CreateNode("nic-node", nicArmId, "Microsoft.Network/networkInterfaces"),
            CreateNode("pe-node", PrivateEndpointArmId, "Microsoft.Network/privateEndpoints"),
            CreateNode("storage-node", StorageArmId, "Microsoft.Storage/storageAccounts"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("vm-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PeReachableTarget, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            CreateEdge("pe-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            CreateEdge("pe-node", "nic-node", AzureInventoryRelationshipAssociationTypes.PeToNic, GraphEdgeInferenceSources.InventoryPeNic),
            CreateEdge(
                "vm-node",
                "nic-node",
                useInferenceSourceOnlyVmNic ? "CONNECTS_TO" : AzureInventoryRelationshipAssociationTypes.VmToNic,
                InventoryDiagramIndirectRelationshipEdgeSources.VmNic),
        ];

        return CreateGraph(nodes, edges);
    }

    private static GraphSnapshot BuildPrivateEndpointDifferentSubnetGraph()
    {
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic";
        const string peSubnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/pe-subnet";
        const string consumerSubnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/consumer-subnet";

        List<GraphNode> nodes =
        [
            CreateNode("nic-node", nicArmId, "Microsoft.Network/networkInterfaces"),
            CreateNode("pe-node", PrivateEndpointArmId, "Microsoft.Network/privateEndpoints"),
            CreateNode("storage-node", StorageArmId, "Microsoft.Storage/storageAccounts"),
            CreateNode("pe-subnet-node", peSubnetArmId, "Microsoft.Network/virtualNetworks/subnets"),
            CreateNode("consumer-subnet-node", consumerSubnetArmId, "Microsoft.Network/virtualNetworks/subnets"),
        ];

        List<GraphEdge> edges =
        [
            CreateEdge("nic-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PeReachableTarget, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            CreateEdge("pe-node", "storage-node", AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            CreateEdge("pe-node", "pe-subnet-node", AzureInventoryRelationshipAssociationTypes.PeToSubnet, GraphEdgeInferenceSources.InventoryPeSubnet),
            CreateEdge("nic-node", "consumer-subnet-node", AzureInventoryRelationshipAssociationTypes.NicToSubnet, GraphEdgeInferenceSources.InventoryNicSubnet),
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
