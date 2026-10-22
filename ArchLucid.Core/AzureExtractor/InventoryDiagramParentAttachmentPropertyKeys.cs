namespace ArchLucid.Core.AzureExtractor;

/// <summary>Graph node property keys for NR-03 parent attachment projection.</summary>
public static class InventoryDiagramParentAttachmentPropertyKeys
{
    public const string EvidenceCurrency = "inventory.parentAttachment.evidenceCurrency";

    public const string ParentArmIdPrefix = "inventory.parentAttachment.parent.";

    public const string ParentArmIdSuffix = ".armId";

    public const string ExternalTargetArmId = "inventory.parentAttachment.externalTargetArmId";

    public const string RestorePointSourceArmId = "inventory.parentAttachment.restorePointSourceArmId";

    public const string AccessConnectorParentArmId = "inventory.parentAttachment.accessConnectorParentArmId";
}
