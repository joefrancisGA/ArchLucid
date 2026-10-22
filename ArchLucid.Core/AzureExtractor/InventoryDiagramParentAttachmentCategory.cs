namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Inventory diagram child categories that attach to a proven parent (NR-03).
/// </summary>
public enum InventoryDiagramParentAttachmentCategory
{
    PublicIp = 0,
    Component = 1,
    NamespaceChild = 2,
    Service = 3,
    RestorePointCollection = 4,
    ImageTemplate = 5,
    AccessConnector = 6,
}
