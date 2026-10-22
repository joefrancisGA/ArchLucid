using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowNsgAttachmentIndexTests
{
    private const string VmArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm";

    private const string NicOneArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-one";

    private const string NicTwoArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-two";

    [Fact]
    public void Build_preserves_nic_identity_instead_of_collapsing_nsg_rules_to_vm_owner()
    {
        GraphNode vm = CreateNode("vm-node", VmArmId, "Microsoft.Compute/virtualMachines");
        GraphNode nicOne = CreateNode("nic-one-node", NicOneArmId, "Microsoft.Network/networkInterfaces");
        GraphNode nicTwo = CreateNode("nic-two-node", NicTwoArmId, "Microsoft.Network/networkInterfaces");
        GraphNode nsgOne = CreateNsgNode("nsg-one-node", "nsg-one", NicOneArmId);
        GraphNode nsgTwo = CreateNsgNode("nsg-two-node", "nsg-two", NicTwoArmId);

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = [vm, nicOne, nicTwo, nsgOne, nsgTwo],
            Edges =
            [
                CreateEdge("vm-node", "nic-one-node"),
                CreateEdge("vm-node", "nic-two-node"),
            ],
        };

        Dictionary<string, List<InventoryDiagramDataFlowNsgEndpointAttachment>> index =
            InventoryDiagramDataFlowNsgAttachmentIndex.Build(graph);

        index.Should().ContainKey(NicOneArmId.ToLowerInvariant());
        index.Should().ContainKey(NicTwoArmId.ToLowerInvariant());
        index.Should().NotContainKey(VmArmId.ToLowerInvariant());
        index[NicOneArmId.ToLowerInvariant()].Should().ContainSingle(attachment => attachment.NsgName == "nsg-one");
        index[NicTwoArmId.ToLowerInvariant()].Should().ContainSingle(attachment => attachment.NsgName == "nsg-two");

        InventoryDiagramDataFlowNsgAttachmentIndex.ResolveEndpointAttachments(
                graph,
                vm,
                index)
            .Should()
            .BeEmpty();

        InventoryDiagramDataFlowNsgAttachmentIndex.ResolveEndpointAttachments(
                graph,
                nicOne,
                index)
            .Should()
            .ContainSingle(attachment => attachment.NsgName == "nsg-one");
    }

    private static GraphNode CreateNode(string nodeId, string armId, string armType) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId[(armId.LastIndexOf('/') + 1)..],
            Category = "compute",
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
            },
        };

    private static GraphNode CreateNsgNode(string nodeId, string name, string targetArmId) =>
        new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = name,
            Category = "network",
            SourceType = "azure-inventory-snapshot",
            SourceId = $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/{name}",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/{name}",
                ["arm.type"] = "Microsoft.Network/networkSecurityGroups",
                [$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] = targetArmId,
                [$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] = AzureInventoryNsgAssociationParser.NicKind,
            },
        };

    private static GraphEdge CreateEdge(string fromNodeId, string toNodeId) =>
        new()
        {
            EdgeId = $"edge-{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.VmToNic,
            InferenceSource = GraphEdgeInferenceSources.InventoryVmNic,
        };
}
