namespace ArchLucid.Core.AzureExtractor;

/// <summary>Graph node property keys for NR-05 orphaned-state classification.</summary>
public static class InventoryDiagramOrphanedStatePropertyKeys
{
    public const string EvidenceCurrency = "inventory.orphanedState.evidenceCurrency";

    public const string PrivateEndpointTargetArmId = "inventory.orphanedState.privateEndpointTargetArmId";

    public const string RequiredSubnetArmId = "inventory.orphanedState.requiredSubnetArmId";

    public const string RequiredVirtualNetworkArmId = "inventory.orphanedState.requiredVirtualNetworkArmId";
}
