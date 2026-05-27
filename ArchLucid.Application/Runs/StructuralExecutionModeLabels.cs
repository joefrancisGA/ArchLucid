using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.Runs;

/// <summary>Buyer/operator copy for persisted <see cref="StructuralExecutionMode" /> (INV-002).</summary>
public static class StructuralExecutionModeLabels
{
    public const string MixedDetail =
        "Mixed execution: some agent steps used deterministic substitution while others used the configured model path. " +
        "Treat numeric highlights conservatively and review per-agent traces.";

    public static string ToDisplayLabel(StructuralExecutionMode mode) =>
        mode switch
        {
            StructuralExecutionMode.Real => "Real",
            StructuralExecutionMode.Simulator => "Simulator",
            StructuralExecutionMode.Fallback => "Fallback",
            StructuralExecutionMode.Mixed => "Mixed",
            _ => mode.ToString()
        };

    public static string ToOperatorDetail(StructuralExecutionMode mode) =>
        mode switch
        {
            StructuralExecutionMode.Real =>
                "Persisted label: live model path for agent steps (no recorded simulator substitution for this run).",
            StructuralExecutionMode.Simulator =>
                "Persisted label: deterministic analysis path for agent steps (repeatable, no billable model usage for those steps).",
            StructuralExecutionMode.Fallback =>
                "Persisted label: real path was attempted but this run recorded simulator substitution after fallback.",
            StructuralExecutionMode.Mixed => MixedDetail,
            _ => FormattableString.Invariant($"Persisted label: {mode}.")
        };
}
