using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Closed, mode-independent vocabulary for visible inventory relationship labels (IDX-04).
/// </summary>
internal static class DiagramRelationshipVerbCatalog
{
    public static bool TryResolve(string? value, out string label)
    {
        label = string.Empty;

        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        string normalized = value.Trim();

        if (normalized.Equals(GraphEdgeTypes.Contains, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeTypes.ContainsResource, StringComparison.OrdinalIgnoreCase))
        {
            label = "contains";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase))
        {
            label = "peering";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase))
        {
            label = "applies";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            label = "protects";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
        {
            label = "uses";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            label = "reads";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            label = "writes";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase))
        {
            label = "may access";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.FederatesAs, StringComparison.OrdinalIgnoreCase))
        {
            label = "federates";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.MemberOf, StringComparison.OrdinalIgnoreCase))
        {
            label = "member of";
            return true;
        }

        if (normalized.Equals(GraphEdgeInferenceSources.HumanDeclaredConnection, StringComparison.OrdinalIgnoreCase))
        {
            label = "declared";
            return true;
        }

        if (normalized.Equals(AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryPeNic, StringComparison.OrdinalIgnoreCase))
        {
            label = "in";
            return true;
        }

        if (normalized.Equals(GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase))
        {
            label = "likely · in";
            return true;
        }

        return false;
    }
}
