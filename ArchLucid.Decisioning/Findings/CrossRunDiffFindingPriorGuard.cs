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

    /// <summary>
    ///     Wave-6 suggestion 54: when a prior graph snapshot id is present, missing Γ is incomplete — not a quiet first review.
    /// </summary>
    public static void EnsurePriorGraphLoadedOrThrow(
        FindingAnalysisContext? analysisContext,
        GraphSnapshot? priorGraph,
        string engineType)
    {
        if (analysisContext?.Prior?.PriorGraphSnapshotId is not Guid priorGraphId || priorGraphId == Guid.Empty)
            return;

        if (priorGraph is not null)
            return;

        throw new InvalidOperationException(
            $"Cross-run engine '{engineType}' requires prior graph snapshot '{priorGraphId:D}' but it could not be loaded.");
    }
}
