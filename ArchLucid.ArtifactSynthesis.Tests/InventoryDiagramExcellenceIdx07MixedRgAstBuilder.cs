using ArchLucid.ArtifactSynthesis.Models;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>Manual mixed RG <see cref="DiagramAst" /> matching <see cref="DiagramForestRoleColumnLayoutTests" />.</summary>
public static class InventoryDiagramExcellenceIdx07MixedRgAstBuilder
{
    public static DiagramAst Build(string title)
    {
        return new DiagramAst
        {
            Title = title,
            Nodes =
            [
                Node("nsg", "edge-nsg", "Microsoft.Network/networkSecurityGroups", "rg-app"),
                Node("vm", "app-vm", "Microsoft.Compute/virtualMachines", "rg-app"),
                Node("kv", "app-kv", "Microsoft.KeyVault/vaults", "rg-app"),
                Node("storage", "app-st", "Microsoft.Storage/storageAccounts", "rg-app"),
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "nsg", ToNodeId = "vm", Label = "applies" },
                new DiagramEdge { FromNodeId = "vm", ToNodeId = "kv", Label = "uses" },
                new DiagramEdge { FromNodeId = "vm", ToNodeId = "storage", Label = "uses" },
            ],
        };
    }

    private static DiagramNode Node(string nodeId, string label, string armType, string resourceGroup)
    {
        return new DiagramNode
        {
            NodeId = nodeId,
            Label = label,
            ArmResourceType = armType,
            ArmResourceGroup = resourceGroup,
            OrderKey = 0,
        };
    }
}
