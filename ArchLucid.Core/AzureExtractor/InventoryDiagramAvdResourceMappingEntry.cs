namespace ArchLucid.Core.AzureExtractor;

public sealed class InventoryDiagramAvdResourceMappingEntry
{
    public InventoryDiagramAvdResourceMappingEntry(string armResourceType, InventoryDiagramAvdCategory category)
    {
        ArmResourceType = armResourceType;
        Category = category;
    }

    public string ArmResourceType
    {
        get;
    }

    public InventoryDiagramAvdCategory Category
    {
        get;
    }
}
