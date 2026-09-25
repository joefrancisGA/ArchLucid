using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramOrphanedStateClassifierTests
{
    private const string MissingVirtualMachineArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-deleted";

    private const string RestorePointCollectionArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/restorePointCollections/rpc-app";

    private const string StorageAccountArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/standalone";

    private const string WorkflowArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";

    private const string DeletedStorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/st-deleted";

    private const string ConnectionArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/connections/vpn-conn";

    private const string GatewayArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworkGateways/gw-a";

    [Fact]
    public void Classify_restore_point_collection_with_missing_vm_is_orphaned_and_names_vm()
    {
        GraphNode restorePointCollection = CreateTopologyNode(
            "rpc-node",
            RestorePointCollectionArmId,
            "Microsoft.Compute/restorePointCollections");
        restorePointCollection.Properties[InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId] =
            MissingVirtualMachineArmId;

        GraphSnapshot graph = CreateGraph([restorePointCollection], []);

        InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
            restorePointCollection,
            graph,
            hasCitedDiagramEdges: false);

        result.State.Should().Be(InventoryDiagramConnectionState.Orphaned);
        result.MissingRequirementMessage.Should().Contain("vm-deleted");
        result.MissingRequirementMessage.Should().Contain("virtual machine");
    }

    [Fact]
    public void Classify_storage_account_without_optional_relationships_is_unconnected()
    {
        GraphNode storage = CreateTopologyNode(
            "storage-node",
            StorageAccountArmId,
            "Microsoft.Storage/storageAccounts");

        GraphSnapshot graph = CreateGraph([storage], []);

        InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
            storage,
            graph,
            hasCitedDiagramEdges: false);

        result.State.Should().Be(InventoryDiagramConnectionState.Unconnected);
        result.MissingRequirementMessage.Should().BeNull();
    }

    [Fact]
    public void Classify_workflow_with_deleted_target_marks_action_unresolved_and_keeps_workflow_unconnected()
    {
        GraphNode workflow = CreateTopologyNode(
            "workflow-node",
            WorkflowArmId,
            "Microsoft.Logic/workflows");
        workflow.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix}SendEmail{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix}"] =
            DeletedStorageArmId;

        GraphSnapshot graph = CreateGraph([workflow], []);

        InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
            workflow,
            graph,
            hasCitedDiagramEdges: false);

        result.State.Should().Be(InventoryDiagramConnectionState.Unconnected);
        result.MissingRequirementMessage.Should().BeNull();
        result.UnresolvedRelationshipDetails.Should().ContainSingle(detail =>
            detail.Contains("SendEmail", StringComparison.Ordinal)
            && detail.Contains("st-deleted", StringComparison.Ordinal));
    }

    [Fact]
    public void Classify_configured_connection_with_missing_endpoint_is_not_orphaned()
    {
        GraphNode gateway = CreateTopologyNode(
            "gateway-node",
            GatewayArmId,
            "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode(
            "connection-node",
            ConnectionArmId,
            "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Configured.ToString();
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        GraphSnapshot graph = CreateGraph([gateway, connection], []);

        InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
            connection,
            graph,
            hasCitedDiagramEdges: false);

        result.State.Should().BeNull();
    }

    [Fact]
    public void Classify_observed_connection_with_missing_endpoint_is_not_orphaned()
    {
        GraphNode gateway = CreateTopologyNode(
            "gateway-node",
            GatewayArmId,
            "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode(
            "connection-node",
            ConnectionArmId,
            "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] =
            InventoryDiagramEvidenceCurrency.Observed.ToString();
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        GraphSnapshot graph = CreateGraph([gateway, connection], []);

        InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
            connection,
            graph,
            hasCitedDiagramEdges: false);

        result.State.Should().BeNull();
    }

    [Fact]
    public void Classify_current_connection_with_missing_endpoint_is_orphaned()
    {
        GraphNode gateway = CreateTopologyNode(
            "gateway-node",
            GatewayArmId,
            "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode(
            "connection-node",
            ConnectionArmId,
            "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        GraphSnapshot graph = CreateGraph([gateway, connection], []);

        InventoryDiagramConnectionStateResult result = InventoryDiagramOrphanedStateClassifier.Classify(
            connection,
            graph,
            hasCitedDiagramEdges: false);

        result.State.Should().Be(InventoryDiagramConnectionState.Orphaned);
        result.MissingRequirementMessage.Should().Contain("lng-missing");
    }

    private static GraphSnapshot CreateGraph(
        IReadOnlyList<GraphNode> nodes,
        IReadOnlyList<GraphEdge> edges)
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

    private static GraphNode CreateTopologyNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId,
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
