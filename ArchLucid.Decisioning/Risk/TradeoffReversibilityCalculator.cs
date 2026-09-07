using ArchLucid.Contracts.Risk;
using ArchLucid.KnowledgeGraph.WafTradeoff;

namespace ArchLucid.Decisioning.Risk;

internal static class TradeoffReversibilityCalculator
{
    public static ReversibilityClass Compute(
        ManifestTradeoffScanContext scanContext,
        WafTradeoffCatalogEntry catalogEntry,
        IReadOnlyList<string> evidenceNodeIds)
    {
        ArgumentNullException.ThrowIfNull(scanContext);
        ArgumentNullException.ThrowIfNull(catalogEntry);

        int maxFanIn = 0;

        foreach (string nodeId in evidenceNodeIds)
        {
            if (scanContext.DependencyFanInByNodeId.TryGetValue(nodeId, out int fanIn))
                maxFanIn = Math.Max(maxFanIn, fanIn);
        }

        ReversibilityClass computed = maxFanIn switch
        {
            >= 5 => ReversibilityClass.OneWayDoor,
            >= 2 => ReversibilityClass.Costly,
            _ => ReversibilityClass.Reversible,
        };

        return MaxRestrictiveness(computed, catalogEntry.DefaultReversibility);
    }

    private static ReversibilityClass MaxRestrictiveness(ReversibilityClass left, ReversibilityClass right) =>
        (ReversibilityClass)Math.Max((int)left, (int)right);
}
