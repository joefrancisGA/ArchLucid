using ArchLucid.Application.Diffs;

namespace ArchLucid.Application.Governance;

/// <summary>Lightweight finding counts from <see cref="AgentResultDiffResult" /> (TB-261).</summary>
public static class RecurrenceFindingDeltaCalculator
{
    public static (int NewFindingCount, int ResolvedFindingCount) CountFindingDelta(AgentResultDiffResult? diff)
    {
        if (diff is null || diff.AgentDeltas.Count == 0)
            return (0, 0);

        int added = diff.AgentDeltas.Sum(d => d.AddedFindings.Count);
        int removed = diff.AgentDeltas.Sum(d => d.RemovedFindings.Count);

        return (added, removed);
    }
}
