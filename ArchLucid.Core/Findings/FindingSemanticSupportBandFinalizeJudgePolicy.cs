using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Findings;

/// <summary>
///     ADR 0099: the semantic LLM judge is default-on for Real finalize, never for Simulator/Fallback.
/// </summary>
public static class FindingSemanticSupportBandFinalizeJudgePolicy
{
    public static bool ShouldRun(
        StructuralExecutionMode structuralExecutionMode,
        FindingSemanticSupportBandOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (structuralExecutionMode != StructuralExecutionMode.Real)
            return false;

        return options.EnableLlmJudgeOnFinalize;
    }
}
