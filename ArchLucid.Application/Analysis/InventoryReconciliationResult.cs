namespace ArchLucid.Application.Analysis;

public sealed record InventoryReconciliationResult(
    int GraphTopologyResourceCount,
    int InventoryResourceCount,
    IReadOnlyList<string> GraphOnlyResourceIds,
    IReadOnlyList<string> InventoryOnlyResourceIds)
{
    public static readonly InventoryReconciliationResult Empty = new(0, 0, [], []);

    public bool HasMismatches => GraphOnlyResourceIds.Count > 0 || InventoryOnlyResourceIds.Count > 0;
}
