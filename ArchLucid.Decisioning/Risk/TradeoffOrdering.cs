using ArchLucid.Contracts.Risk;

namespace ArchLucid.Decisioning.Risk;

public static class TradeoffOrdering
{
    public static List<ArchitectureTradeoff> Sort(IReadOnlyList<ArchitectureTradeoff> tradeoffs)
    {
        return tradeoffs
            .OrderBy(static tradeoff => StatusSortKey(tradeoff.Status))
            .ThenByDescending(static tradeoff => (int)tradeoff.Consequence)
            .ThenByDescending(static tradeoff => (int)tradeoff.Reversibility)
            .ToList();
    }

    private static int StatusSortKey(TradeoffStatus status) =>
        status switch
        {
            TradeoffStatus.Conflicting => 0,
            TradeoffStatus.Unacknowledged => 1,
            TradeoffStatus.Acknowledged => 2,
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown tradeoff status."),
        };
}
