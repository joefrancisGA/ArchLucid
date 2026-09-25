namespace ArchLucid.Core.AzureExtractor;

/// <summary>Inference source strings used by NR-04 indirect relationship resolution in Core.</summary>
public static class InventoryDiagramIndirectRelationshipEdgeSources
{
    public const string ObservedDependency = "inventory-observed-dependency";

    public const string PrivateEndpoint = "inventory-private-endpoint";

    public const string VmNic = "inventory-vm-nic";

    public const string NicSubnet = "inventory-nic-subnet";

    public const string ResourceGroupCollocation = "inventory-rg-collocation";

    public const string PropertyArmId = "inventory-property-arm-id";

    public const string IndirectDerivedRelationship = "inventory-indirect-derived-relationship";
}
