using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Core.ExecutionMode;

/// <summary>
///     Resolves per-task structural execution mode at persist/execute time (INV-002 / TB-970).
/// </summary>
public static class PerTaskStructuralExecutionModeResolver
{
    /// <summary>Mode for a task executed on the simulator host executor path.</summary>
    public static StructuralExecutionMode ForSimulatorHostPath(bool realModeFellBackToSimulator)
    {
        if (realModeFellBackToSimulator)
            return StructuralExecutionMode.Fallback;

        return StructuralExecutionMode.Simulator;
    }

    /// <summary>Mode for a task executed on the real host executor path.</summary>
    public static StructuralExecutionMode ForRealHostPath(AgentExecutionOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        string mode = options.Mode.Trim();

        return mode.Equals("Real", StringComparison.OrdinalIgnoreCase)
            ? StructuralExecutionMode.Real
            : StructuralExecutionMode.Simulator;
    }
}
