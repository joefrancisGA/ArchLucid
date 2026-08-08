using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Runs;

/// <summary>
/// Maps host <see cref="AgentExecutionOptions" /> and pilot fallback flags to <see cref="StructuralExecutionMode" />,
/// and rolls up per-task final outcomes per <c>docs/library/INV002_EXECUTION_MODE_AGGREGATION_CONTRACT.md</c> (TB-969).
/// </summary>
public static class StructuralExecutionModeResolver
{
    /// <summary>
    /// Rolls up final per-task modes to a run label (TB-969). Returns <see langword="null" /> when no final tasks exist.
    /// <see cref="TaskExecutionModeOutcome.CacheServed" /> is disclosure-only and does not change roll-up.
    /// </summary>
    public static StructuralExecutionMode? AggregateFromFinalTaskOutcomes(IReadOnlyList<TaskExecutionModeOutcome> finalTaskOutcomes)
    {
        ArgumentNullException.ThrowIfNull(finalTaskOutcomes);

        if (finalTaskOutcomes.Count == 0)
        {
            return null;
        }

        StructuralExecutionMode? runMode = null;

        foreach (TaskExecutionModeOutcome outcome in finalTaskOutcomes)
        {
            if (runMode is null)
            {
                runMode = outcome.Mode;
                continue;
            }

            if (runMode.Value != outcome.Mode)
            {
                return StructuralExecutionMode.Mixed;
            }
        }

        return runMode;
    }

    /// <summary>Resolves the effective structural mode after execute completes (or when recording pilot fallback).</summary>
    public static StructuralExecutionMode FromAgentExecutionOptionsAndFallback(AgentExecutionOptions options, bool realModeFellBackToSimulator)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (realModeFellBackToSimulator)
            return StructuralExecutionMode.Fallback;

        string mode = options.Mode.Trim();

        return mode.Equals("Real", StringComparison.OrdinalIgnoreCase) ? StructuralExecutionMode.Real : StructuralExecutionMode.Simulator;
    }
}
