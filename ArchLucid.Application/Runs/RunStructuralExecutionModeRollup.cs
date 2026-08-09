using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Recomputes run <see cref="StructuralExecutionMode" /> from persisted per-task stamps (TB-970 / TB-969).
/// </summary>
public static class RunStructuralExecutionModeRollup
{
    /// <summary>
    ///     Returns aggregated run mode when at least one result carries a stamped task mode; otherwise <see langword="null" />.
    /// </summary>
    public static StructuralExecutionMode? TryResolveFromStampedResults(IReadOnlyList<AgentResult> finalResults)
    {
        ArgumentNullException.ThrowIfNull(finalResults);

        List<TaskExecutionModeOutcome> outcomes = [];

        foreach (AgentResult result in finalResults)
        {
            if (result.TaskStructuralExecutionMode is not StructuralExecutionMode mode)
                continue;

            outcomes.Add(new TaskExecutionModeOutcome(result.TaskId, mode, result.CacheServed));
        }

        return StructuralExecutionModeResolver.AggregateFromFinalTaskOutcomes(outcomes);
    }
}
