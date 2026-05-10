using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Runs;

/// <summary>Maps host <see cref="AgentExecutionOptions" /> and pilot fallback flags to <see cref="StructuralExecutionMode" />.</summary>
public static class StructuralExecutionModeResolver
{
    /// <summary>Resolves the effective structural mode after execute completes (or when recording pilot fallback).</summary>
    public static StructuralExecutionMode FromAgentExecutionOptionsAndFallback(AgentExecutionOptions options, bool realModeFellBackToSimulator)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (realModeFellBackToSimulator)
            return StructuralExecutionMode.Fallback;

        string mode = options.Mode?.Trim() ?? "";

        if (mode.Equals("Real", StringComparison.OrdinalIgnoreCase))
            return StructuralExecutionMode.Real;

        return StructuralExecutionMode.Simulator;
    }
}
