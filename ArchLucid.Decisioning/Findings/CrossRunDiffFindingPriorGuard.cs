using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Findings;

/// <summary>
///     Wave-4 suggestion 31: cross-run diff engines require typed prior revision; missing prior is incomplete, not success.
/// </summary>
public static partial class CrossRunDiffFindingPriorGuard
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

    /// <summary>
    ///     When a prior run is bound but neither Γ nor context metadata carries revision data, fail closed.
    /// </summary>
    public static void EnsurePriorRevisionResolvableOrThrow(
        FindingAnalysisContext? analysisContext,
        GraphSnapshot? priorGraph,
        GraphSnapshot graphSnapshot,
        string contextPriorPropertyKey,
        string engineType)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);
        ArgumentException.ThrowIfNullOrWhiteSpace(contextPriorPropertyKey);

        if (analysisContext?.Prior?.PriorRunId is not Guid priorRunId || priorRunId == Guid.Empty)
            return;

        if (priorGraph is not null)
            return;

        if (analysisContext.Prior.PriorGraphSnapshotId is Guid priorGraphId && priorGraphId != Guid.Empty)
            return;

        if (HasContextPriorMetadata(graphSnapshot, contextPriorPropertyKey))
            return;

        throw new InvalidOperationException(
            $"Cross-run engine '{engineType}' requires prior revision data for run '{priorRunId:D}' but none was resolved from graph snapshot or context metadata '{contextPriorPropertyKey}'.");
    }

    private static bool HasContextPriorMetadata(GraphSnapshot graphSnapshot, string contextPriorPropertyKey)
    {
        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(node =>
            string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode?.Properties.TryGetValue(contextPriorPropertyKey, out string? priorRaw) != true)
            return false;

        return !string.IsNullOrWhiteSpace(priorRaw);
    }
}
