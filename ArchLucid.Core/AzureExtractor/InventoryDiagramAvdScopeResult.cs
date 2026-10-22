namespace ArchLucid.Core.AzureExtractor;

public sealed class InventoryDiagramAvdScopeResult
{
    public HashSet<string> AvdOnlyNodeIds
    {
        get;
        init;
    } = new(StringComparer.Ordinal);

    public Dictionary<string, string> NodeIdToHostPoolArmId
    {
        get;
        init;
    } = new(StringComparer.Ordinal);

    public HashSet<string> SharedBoundaryNodeIds
    {
        get;
        init;
    } = new(StringComparer.Ordinal);
}
