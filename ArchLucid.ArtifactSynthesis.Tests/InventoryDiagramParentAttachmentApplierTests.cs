using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramParentAttachmentApplierTests
{
    private const string LoadBalancerArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/loadBalancers/lb-app";

    private const string PublicIpArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-front";

    private const string UnresolvedPublicIpArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-orphan";

    private const string ServiceBusNamespaceArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sbns";

    private const string ServiceBusQueueArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ServiceBus/namespaces/sbns/queues/orders";

    private const string VirtualMachineArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";

    private const string RestorePointCollectionArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/restorePointCollections/rpc-app";

    private const string SynapseWorkspaceArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Synapse/workspaces/syn";

    private const string AccessConnectorArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Synapse/workspaces/syn/managedPrivateEndpoints/mpe";

    private const string StorageAccountArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stexternal";

    private const string CollocatedVmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-collocated";

    private const string CollocatedDiskArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk-collocated";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_public_ip_referenced_by_load_balancer_attaches_to_parent_and_removes_child_node()
    {
        GraphSnapshot graph = BuildPublicIpOnLoadBalancerGraph(includeResolvableParent: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceType == "Microsoft.Network/publicIPAddresses");
        DiagramNode loadBalancer = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/loadBalancers").Subject;
        loadBalancer.ParentAttachmentDetails.Should().ContainSingle(detail =>
            detail.Contains("pip-front", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_public_ip_without_parent_reference_keeps_unresolved_node()
    {
        GraphSnapshot graph = BuildUnresolvedPublicIpGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/publicIPAddresses"
            && node.ArmResourceId == UnresolvedPublicIpArmId);
    }

    [Fact]
    public void Compile_service_bus_namespace_owns_queue_as_parent_detail()
    {
        GraphSnapshot graph = BuildServiceBusNamespaceGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == ServiceBusQueueArmId);
        DiagramNode namespaceNode = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.ServiceBus/namespaces").Subject;
        namespaceNode.ParentAttachmentDetails.Should().ContainSingle(detail =>
            detail.Contains("orders", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_restore_point_collection_attaches_to_protected_vm()
    {
        GraphSnapshot graph = BuildRestorePointCollectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceType == "Microsoft.Compute/restorePointCollections");
        DiagramNode virtualMachine = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Compute/virtualMachines").Subject;
        virtualMachine.ParentAttachmentDetails.Should().ContainSingle(detail =>
            detail.Contains("rpc-app", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_access_connector_with_external_target_emits_edge_to_target()
    {
        GraphSnapshot graph = BuildAccessConnectorExternalTargetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceId == AccessConnectorArmId);
        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryAccessConnectorExternalTarget
            && edge.Label.Contains("mpe", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_duplicate_access_connectors_to_same_target_emit_one_edge()
    {
        GraphSnapshot graph = BuildDuplicateAccessConnectorExternalTargetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryAccessConnectorExternalTarget);
    }

    [Fact]
    public void Compile_collocated_resources_do_not_attach_without_cited_parent_reference()
    {
        GraphSnapshot graph = BuildCollocatedResourcesGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().Contain(node => node.ArmResourceId == CollocatedDiskArmId);
        DiagramNode virtualMachine = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == CollocatedVmArmId).Subject;
        virtualMachine.ParentAttachmentDetails.Should().BeEmpty();
    }

    [Fact]
    public void Compile_image_template_is_excluded_from_runtime_topology()
    {
        GraphSnapshot graph = BuildImageTemplateGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            node.ArmResourceType == "Microsoft.VirtualMachineImages/imageTemplates");
    }

    [Fact]
    public void Human_caption_includes_parent_attachment_details()
    {
        DiagramNode parent = new()
        {
            NodeId = "lb-app",
            Label = "lb-app",
            ArmResourceType = "Microsoft.Network/loadBalancers",
            ParentAttachmentDetails = ["Public IP: pip-front"],
        };

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(parent);

        caption.CombinedPlainText.Should().Contain("pip-front");
    }

    private static GraphSnapshot BuildPublicIpOnLoadBalancerGraph(bool includeResolvableParent)
    {
        GraphNode loadBalancer = CreateTopologyNode(
            "lb-node",
            LoadBalancerArmId,
            "Microsoft.Network/loadBalancers");
        loadBalancer.Properties["frontendIPConfigurations"] =
            "[{\"properties\":{\"publicIPAddress\":{\"id\":\"" + PublicIpArmId + "\"}}}]";

        GraphNode publicIp = CreateTopologyNode(
            "pip-node",
            PublicIpArmId,
            "Microsoft.Network/publicIPAddresses");

        List<GraphNode> nodes = includeResolvableParent
            ? [loadBalancer, publicIp]
            : [publicIp];

        return CreateGraph(nodes);
    }

    private static GraphSnapshot BuildUnresolvedPublicIpGraph()
    {
        GraphNode publicIp = CreateTopologyNode(
            "pip-orphan-node",
            UnresolvedPublicIpArmId,
            "Microsoft.Network/publicIPAddresses");

        return CreateGraph([publicIp]);
    }

    private static GraphSnapshot BuildServiceBusNamespaceGraph()
    {
        GraphNode namespaceNode = CreateTopologyNode(
            "sbns-node",
            ServiceBusNamespaceArmId,
            "Microsoft.ServiceBus/namespaces");
        GraphNode queueNode = CreateTopologyNode(
            "queue-node",
            ServiceBusQueueArmId,
            "Microsoft.ServiceBus/namespaces/queues");
        queueNode.Properties["arm.parentId"] = ServiceBusNamespaceArmId;
        queueNode.Properties[
                $"{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdPrefix}0{InventoryDiagramParentAttachmentPropertyKeys.ParentArmIdSuffix}"] =
            ServiceBusNamespaceArmId;

        return CreateGraph([namespaceNode, queueNode]);
    }

    private static GraphSnapshot BuildRestorePointCollectionGraph()
    {
        GraphNode virtualMachine = CreateTopologyNode(
            "vm-node",
            VirtualMachineArmId,
            "Microsoft.Compute/virtualMachines");
        GraphNode restorePointCollection = CreateTopologyNode(
            "rpc-node",
            RestorePointCollectionArmId,
            "Microsoft.Compute/restorePointCollections");
        restorePointCollection.Properties[InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId] =
            VirtualMachineArmId;

        return CreateGraph([virtualMachine, restorePointCollection]);
    }

    private static GraphSnapshot BuildAccessConnectorExternalTargetGraph()
    {
        GraphNode workspace = CreateTopologyNode(
            "syn-node",
            SynapseWorkspaceArmId,
            "Microsoft.Synapse/workspaces");
        GraphNode storage = CreateTopologyNode(
            "storage-node",
            StorageAccountArmId,
            "Microsoft.Storage/storageAccounts");
        GraphNode connector = CreateTopologyNode(
            "connector-node",
            AccessConnectorArmId,
            "Microsoft.Synapse/workspaces/managedPrivateEndpoints");
        connector.Properties[InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] =
            SynapseWorkspaceArmId;
        connector.Properties[InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId] =
            StorageAccountArmId;

        return CreateGraph([workspace, storage, connector]);
    }

    private static GraphSnapshot BuildDuplicateAccessConnectorExternalTargetGraph()
    {
        GraphNode workspace = CreateTopologyNode(
            "syn-node",
            SynapseWorkspaceArmId,
            "Microsoft.Synapse/workspaces");
        GraphNode storage = CreateTopologyNode(
            "storage-node",
            StorageAccountArmId,
            "Microsoft.Storage/storageAccounts");
        GraphNode connectorOne = CreateTopologyNode(
            "connector-one-node",
            AccessConnectorArmId,
            "Microsoft.Synapse/workspaces/managedPrivateEndpoints");
        connectorOne.Properties[InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] =
            SynapseWorkspaceArmId;
        connectorOne.Properties[InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId] =
            StorageAccountArmId;

        GraphNode connectorTwo = CreateTopologyNode(
            "connector-two-node",
            AccessConnectorArmId + "-2",
            "Microsoft.Synapse/workspaces/managedPrivateEndpoints");
        connectorTwo.Properties[InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] =
            SynapseWorkspaceArmId;
        connectorTwo.Properties[InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId] =
            StorageAccountArmId;

        return CreateGraph([workspace, storage, connectorOne, connectorTwo]);
    }

    private static GraphSnapshot BuildCollocatedResourcesGraph()
    {
        GraphNode virtualMachine = CreateTopologyNode(
            "vm-collocated-node",
            CollocatedVmArmId,
            "Microsoft.Compute/virtualMachines");
        GraphNode disk = CreateTopologyNode(
            "disk-collocated-node",
            CollocatedDiskArmId,
            "Microsoft.Compute/disks");

        return CreateGraph([virtualMachine, disk]);
    }

    private static GraphSnapshot BuildImageTemplateGraph()
    {
        GraphNode imageTemplate = CreateTopologyNode(
            "image-template-node",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.VirtualMachineImages/imageTemplates/it-app",
            "Microsoft.VirtualMachineImages/imageTemplates");

        return CreateGraph([imageTemplate]);
    }

    private static GraphSnapshot CreateGraph(IReadOnlyList<GraphNode> nodes)
    {
        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes.ToList(),
            Edges = [],
        };
    }

    private static GraphNode CreateTopologyNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = MermaidIdSanitizer.Sanitize(armId),
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
