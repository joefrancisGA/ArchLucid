namespace ArchLucid.Application.Analysis;

public sealed record InventoryReconciliationResult(
    int GraphTopologyResourceCount,
    int InventoryResourceCount,
    IReadOnlyList<string> GraphOnlyResourceIds,
    IReadOnlyList<string> InventoryOnlyResourceIds,
    bool InventorySnapshotAbsent = false)
{
    public static readonly InventoryReconciliationResult Empty = new(0, 0, [], [], false);

    public bool HasMismatches => GraphOnlyResourceIds.Count > 0 || InventoryOnlyResourceIds.Count > 0;
}
