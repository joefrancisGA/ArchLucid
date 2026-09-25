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
public sealed class InventoryDiagramOrphanedStateApplierTests
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

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_restore_point_collection_with_missing_vm_is_orphaned_and_names_vm()
    {
        GraphSnapshot graph = BuildRestorePointCollectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode restorePointCollection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == RestorePointCollectionArmId).Subject;
        restorePointCollection.ConnectionState.Should().Be(InventoryDiagramConnectionState.Orphaned);
        restorePointCollection.ConnectionStateMessage.Should().Contain("vm-deleted");
        restorePointCollection.ConnectionStateMessage.Should().Contain("virtual machine");

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(restorePointCollection);
        caption.CombinedPlainText.Should().Contain("Orphaned:");
        caption.CombinedPlainText.Should().Contain("vm-deleted");
    }

    [Fact]
    public void Compile_storage_account_without_optional_relationships_is_unconnected()
    {
        GraphSnapshot graph = BuildUnconnectedStorageGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode storage = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceId == StorageAccountArmId).Subject;
        storage.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(storage);
        caption.CombinedPlainText.Should().Contain("Unconnected");
    }

    [Fact]
    public void Compile_workflow_with_deleted_target_keeps_workflow_and_marks_action_unresolved()
    {
        GraphSnapshot graph = BuildWorkflowWithDeletedTargetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode workflow = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Logic/workflows").Subject;
        workflow.ConnectionState.Should().Be(InventoryDiagramConnectionState.Unconnected);
        workflow.ConnectionStateMessage.Should().BeNull();
        workflow.UnresolvedRelationshipDetails.Should().ContainSingle(detail =>
            detail.Contains("SendEmail", StringComparison.Ordinal)
            && detail.Contains("st-deleted", StringComparison.Ordinal));

        DiagramNodeHumanCaption caption = DiagramNodeHumanCaptionFactory.Create(workflow);
        caption.CombinedPlainText.Should().Contain("SendEmail");
        caption.CombinedPlainText.Should().Contain("st-deleted");
        caption.CombinedPlainText.Should().NotContain("Orphaned:");
    }

    [Fact]
    public void Compile_configured_connection_with_missing_endpoint_is_not_orphaned()
    {
        GraphSnapshot graph = BuildConfiguredConnectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode connection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/connections").Subject;
        connection.ConnectionState.Should().BeNull();
        connection.ConnectionStateMessage.Should().BeNull();
    }

    [Fact]
    public void Compile_observed_connection_with_missing_endpoint_is_not_orphaned()
    {
        GraphSnapshot graph = BuildObservedConnectionGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode connection = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/connections").Subject;
        connection.ConnectionState.Should().BeNull();
        connection.ConnectionStateMessage.Should().BeNull();
    }

    private static GraphSnapshot BuildRestorePointCollectionGraph()
    {
        GraphNode restorePointCollection = CreateTopologyNode(
            "rpc-node",
            RestorePointCollectionArmId,
            "Microsoft.Compute/restorePointCollections");
        restorePointCollection.Properties[InventoryDiagramParentAttachmentPropertyKeys.RestorePointSourceArmId] =
            MissingVirtualMachineArmId;

        return CreateGraph([restorePointCollection]);
    }

    private static GraphSnapshot BuildUnconnectedStorageGraph()
    {
        GraphNode storage = CreateTopologyNode(
            "storage-node",
            StorageAccountArmId,
            "Microsoft.Storage/storageAccounts");

        return CreateGraph([storage]);
    }

    private static GraphSnapshot BuildWorkflowWithDeletedTargetGraph()
    {
        GraphNode workflow = CreateTopologyNode(
            "workflow-node",
            WorkflowArmId,
            "Microsoft.Logic/workflows");
        workflow.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix}SendEmail{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix}"] =
            DeletedStorageArmId;

        return CreateGraph([workflow]);
    }

    private static GraphSnapshot BuildConfiguredConnectionGraph()
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
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = "IPsec";
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        return CreateGraph([gateway, connection]);
    }

    private static GraphSnapshot BuildObservedConnectionGraph()
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
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = "IPsec";
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayArmId;
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/localNetworkGateways/lng-missing";

        return CreateGraph([gateway, connection]);
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
