using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Single RG with four role-diverse nodes for IDX-07 role-column ratchet.</summary>
public static class InventoryDiagramExcellenceIdx07MixedRgGraphFixture
{
    public static GraphSnapshot Build()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(Node("nsg", "edge-nsg", "Microsoft.Network/networkSecurityGroups", GraphTopologyCategories.Network));
        graph.Nodes.Add(Node("vm", "app-vm", "Microsoft.Compute/virtualMachines", GraphTopologyCategories.Compute));
        graph.Nodes.Add(Node("kv", "app-kv", "Microsoft.KeyVault/vaults", GraphTopologyCategories.Identity));
        graph.Nodes.Add(Node("storage", "app-st", "Microsoft.Storage/storageAccounts", GraphTopologyCategories.Storage));

        graph.Edges.Add(Edge("nsg", "vm", "applies"));
        graph.Edges.Add(Edge("vm", "kv", "uses"));
        graph.Edges.Add(Edge("vm", "storage", "uses"));

        return graph;
    }

    private static GraphNode Node(string nodeId, string label, string armType, string category)
    {
        const string resourceGroup = "rg-app";
        string armId = $"/subscriptions/s/resourceGroups/{resourceGroup}/providers/{armType}/{nodeId}";

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = resourceGroup,
            },
        };
    }

    private static GraphEdge Edge(string fromNodeId, string toNodeId, string label)
    {
        return new GraphEdge
        {
            EdgeId = $"{fromNodeId}-{toNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = GraphEdgeTypes.ConnectsTo,
            Label = label,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryVmNic,
        };
    }
}
