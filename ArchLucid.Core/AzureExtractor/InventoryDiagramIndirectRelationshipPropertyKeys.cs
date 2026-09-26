namespace ArchLucid.Core.AzureExtractor;

/// <summary>Graph property keys for NR-04 indirect relationship projection.</summary>
public static class InventoryDiagramIndirectRelationshipPropertyKeys
{
    public const string EvidenceCurrency = "inventory.indirectRelationship.evidenceCurrency";

    public const string EvidenceSource = "inventory.indirectRelationship.evidenceSource";

    public const string DerivedHopPrefix = "inventory.indirectRelationship.derivedHop.";

    public const string DerivedHopArmIdSuffix = ".armId";

    public const string DerivedHopLabelSuffix = ".label";
}
