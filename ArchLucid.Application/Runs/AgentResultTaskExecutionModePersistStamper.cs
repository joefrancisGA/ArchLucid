using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.ExecutionMode;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Ensures per-task execution-mode stamps exist before agent results are persisted (TB-970).
/// </summary>
public static class AgentResultTaskExecutionModePersistStamper
{
    public static void EnsureStamped(
        IReadOnlyList<AgentResult> results,
        AgentExecutionOptions options,
        bool realModeFellBackToSimulator,
        bool isSimulatorHostExecutor)
    {
        ArgumentNullException.ThrowIfNull(results);
        ArgumentNullException.ThrowIfNull(options);

        foreach (AgentResult result in results)
        {
            EnsureStamped(result, options, realModeFellBackToSimulator, isSimulatorHostExecutor);
        }
    }

    public static void EnsureStamped(
        AgentResult result,
        AgentExecutionOptions options,
        bool realModeFellBackToSimulator,
        bool isSimulatorHostExecutor)
    {
        ArgumentNullException.ThrowIfNull(result);
        ArgumentNullException.ThrowIfNull(options);

        if (result.TaskStructuralExecutionMode is null)
        {
            StructuralExecutionMode mode = isSimulatorHostExecutor
                ? PerTaskStructuralExecutionModeResolver.ForSimulatorHostPath(realModeFellBackToSimulator)
                : PerTaskStructuralExecutionModeResolver.ForRealHostPath(options);

            TaskExecutionModeOutcomeApplicator.Apply(result, mode, result.CacheServed);
        }

        if (realModeFellBackToSimulator
            && result.TaskStructuralExecutionMode == StructuralExecutionMode.Simulator)
        {
            result.TaskStructuralExecutionMode = StructuralExecutionMode.Fallback;
        }
    }
}
