using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Wave-4 suggestion 31: cross-run diff engines require typed prior revision; missing prior is incomplete, not success.
/// </summary>
public static class CrossRunDiffFindingPriorGuard
{
    public static void EnsurePriorPresentOrThrow(FindingAnalysisContext? analysisContext, string engineType)
    {
        if (analysisContext?.Prior is not null
            && analysisContext.Prior.PriorRunId != Guid.Empty)
        {
            return;
        }

        throw new InvalidOperationException(
            $"Cross-run engine '{engineType}' requires FindingAnalysisContext.Prior; snapshot generation is incomplete.");
    }
}
