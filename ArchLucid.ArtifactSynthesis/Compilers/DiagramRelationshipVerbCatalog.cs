using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
/// Closed, mode-independent vocabulary for visible inventory relationship labels (IDX-04).
/// </summary>
internal static class DiagramRelationshipVerbCatalog
{
    internal const string InventoryDiagramLayoutContainsLabel =
        "Contained in the inventory layout. This is not an observed dependency.";

    internal const string InventoryLogicAppConnectionConfiguredLabel =
        "API connection is configured. An observed call was not stored.";

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
            label = InventoryDiagramLayoutContainsLabel;
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.PeersWith, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored;
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.AppliesTo, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.AppliesToLinkStoredEnforcementNotObserved;
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.Protects, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.ProtectionLinkStoredObservedProtectionNotStored;
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.HasRole, StringComparison.OrdinalIgnoreCase))
        {
            label = "Role is assigned. Observed use was not stored.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
        {
            label = "Identity is assigned. Use of that identity was not stored.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanAssume, StringComparison.OrdinalIgnoreCase))
        {
            label = "May assume this identity. An assumption was not observed.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanControlCode, StringComparison.OrdinalIgnoreCase))
        {
            label = "Role can control code. This is not an observed deployment.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanAddCredential, StringComparison.OrdinalIgnoreCase))
        {
            label = "Role can add a credential. This is not an observed change.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanGrantRole, StringComparison.OrdinalIgnoreCase))
        {
            label = "Role can grant a role. This is not an observed grant.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            label = "Role allows read. This is not observed use.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            label = "Role allows write. This is not observed use.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.MayAccess, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel;
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.FederatesAs, StringComparison.OrdinalIgnoreCase))
        {
            label = "Federated credential is configured. This is not an observed sign-in.";
            return true;
        }

        if (normalized.Equals(GraphEdgeTypes.MemberOf, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.MemberOfStoredObservedUseNotStoredLabel;
            return true;
        }

        // HumanDeclaredConnection is provenance, not a relationship verb. Provenance display
        // owns the "declared" prefix; keep the relationship verb from edge type (CONNECTS_TO → connects).

        if (normalized.Equals(GraphEdgeInferenceSources.HumanDeclaredConnection, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (normalized.Equals(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.PrivateEndpointTargetStoredReachabilityNotObserved;
            return true;
        }

        if (normalized.Equals(AzureInventoryRelationshipAssociationTypes.NicToSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(AzureInventoryRelationshipAssociationTypes.PeToSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryNicSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryPeSubnet, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryPeNic, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved;
            return true;
        }

        if (normalized.Equals(GraphEdgeInferenceSources.InventoryPrivateEndpoint, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.PrivateAccess;
            return true;
        }

        if (normalized.Equals(GraphEdgeInferenceSources.InventoryResourceGroupCollocation, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GraphEdgeInferenceSources.InventorySynapseLinkedServiceInferred, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramLikelyRelationshipApplier.OutlineSentence;
            return true;
        }

        if (normalized.Equals(GraphEdgeInferenceSources.InventoryAppKeyVaultRef, StringComparison.OrdinalIgnoreCase))
        {
            label = InventoryDiagramRelationshipLabelTexts.AppToKeyVaultRefLabel;
            return true;
        }

        return false;
    }
}
