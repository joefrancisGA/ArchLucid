namespace ArchLucid.Application.Findings;

internal static class InventoryReconciliationFindingPresentation
{
    internal static (string Title, string Rationale, IReadOnlyList<string> RecommendedActions) Resolve(
        string cloudInventoryName,
        bool inventorySnapshotAbsent)
    {
        if (inventorySnapshotAbsent)
        {
            return (
                $"{cloudInventoryName} inventory package was not stored",
                $"Topology resources are present on the graph, but no scoped {cloudInventoryName} inventory package was stored to reconcile against.",
                [
                    $"Collect or upload a scoped {cloudInventoryName} inventory package and attach it to this review.",
                    "Re-run analysis after inventory is linked so reconciliation can compare stored resource identifiers.",
                ]);
        }

        return (
            $"Topology graph and {cloudInventoryName} inventory are out of sync",
            $"At least one topology resource identifier does not match the latest scoped {cloudInventoryName} inventory snapshot.",
            [
                "Update the architecture graph to include live inventory resources that are missing from the review.",
                $"Remove or re-label graph resources that are not present in the scoped {cloudInventoryName} inventory.",
            ]);
    }
}
