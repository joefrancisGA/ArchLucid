using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Layout;

public static class DiagramInventoryPictogramKindResolver
{
    public static DiagramInventoryPictogramKind Resolve(string? armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return DiagramInventoryPictogramKind.Generic;
        }

        string category = AzureInventoryTopologyCategory.Resolve(armType);

        if (string.Equals(category, GraphTopologyCategories.Network, StringComparison.OrdinalIgnoreCase)
            || AzureInventoryTopologyCategory.IsMicrosoftNetworkProviderType(armType))
        {
            return DiagramInventoryPictogramKind.Network;
        }

        if (string.Equals(category, GraphTopologyCategories.Data, StringComparison.OrdinalIgnoreCase)
            || IsDataPlaneArmType(armType))
        {
            return DiagramInventoryPictogramKind.Data;
        }

        if (string.Equals(category, GraphTopologyCategories.Storage, StringComparison.OrdinalIgnoreCase))
        {
            return DiagramInventoryPictogramKind.Storage;
        }

        if (string.Equals(category, GraphTopologyCategories.Identity, StringComparison.OrdinalIgnoreCase)
            || armType.Contains("keyvault", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("/vaults", StringComparison.OrdinalIgnoreCase))
        {
            return DiagramInventoryPictogramKind.Identity;
        }

        return DiagramInventoryPictogramKind.Compute;
    }

    private static bool IsDataPlaneArmType(string armType)
    {
        return armType.Contains("microsoft.sql", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("documentdb", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("dbfor", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("/databases", StringComparison.OrdinalIgnoreCase)
            || armType.Contains("microsoft.cache", StringComparison.OrdinalIgnoreCase);
    }
}
