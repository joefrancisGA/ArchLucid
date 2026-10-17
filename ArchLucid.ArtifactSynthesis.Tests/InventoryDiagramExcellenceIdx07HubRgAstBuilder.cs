using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
/// Four-node star inside one RG. Subgraph ids disable role columns so hub-spoke placement runs (IDX-07).
/// </summary>
public static class InventoryDiagramExcellenceIdx07HubRgAstBuilder
{
    private const string StageId = "rg-interior-stage";

    public static DiagramAst Build(string title)
    {
        return new DiagramAst
        {
            Title = title,
            Subgraphs =
            [
                new DiagramSubgraph { SubgraphId = StageId, Label = "Interior", OrderKey = 0 },
            ],
            Nodes =
            [
                Node("nsg", "edge-nsg", "Microsoft.Network/networkSecurityGroups"),
                Node("vm", "app-vm", "Microsoft.Compute/virtualMachines"),
                Node("kv", "app-kv", "Microsoft.KeyVault/vaults"),
                Node("storage", "app-st", "Microsoft.Storage/storageAccounts"),
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "nsg", ToNodeId = "vm", Label = "applies" },
                new DiagramEdge { FromNodeId = "vm", ToNodeId = "kv", Label = "uses" },
                new DiagramEdge { FromNodeId = "vm", ToNodeId = "storage", Label = "uses" },
            ],
        };
    }

    private static DiagramNode Node(string nodeId, string label, string armType)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            ArmResourceType = armType,
            ArmResourceGroup = "rg-app",
            SubgraphId = StageId,
            OrderKey = 0,
        };
    }
}
