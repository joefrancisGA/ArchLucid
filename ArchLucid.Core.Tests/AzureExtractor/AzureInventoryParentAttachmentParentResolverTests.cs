using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryParentAttachmentParentResolverTests
{
    [Fact]
    public void Resolve_access_connector_reads_parent_and_external_target()
    {
        const string parentArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Synapse/workspaces/syn";
        const string externalTargetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stexternal";

        GraphNode connector = CreateNode(
            "connector-node",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Synapse/workspaces/syn/managedPrivateEndpoints/mpe",
            "Microsoft.Synapse/workspaces/managedPrivateEndpoints");
        connector.Properties[InventoryDiagramParentAttachmentPropertyKeys.AccessConnectorParentArmId] = parentArmId;
        connector.Properties[InventoryDiagramParentAttachmentPropertyKeys.ExternalTargetArmId] = externalTargetArmId;

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = [connector],
            Edges = [],
        };

        AzureInventoryParentAttachmentResolveResult result = AzureInventoryParentAttachmentParentResolver.Resolve(
            connector,
            graph,
            AzureInventoryParentAttachmentParentResolver.BuildPublicIpReferencingParentArmIdMap(graph.Nodes));

        result.ParentArmIds.Should().ContainSingle(id => id.Equals(parentArmId, StringComparison.OrdinalIgnoreCase));
        result.ExternalTargetArmId.Should().BeEquivalentTo(externalTargetArmId);
    }

    private static GraphNode CreateNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
            },
        };
    }
}
