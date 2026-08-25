using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Interfaces;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Resolves Γ for authority review: prefers κ→Γ projection when a knowledge model exists,
///     supplements with context-derived nodes, otherwise falls back to canonical reuse/build.
/// </summary>
public static class KnowledgeModelAwareGraphSnapshotResolver
{
    public static async Task<GraphSnapshotResolutionResult> ResolveAsync(
        ScopeContext scope,
        ContextSnapshot? priorCommittedContext,
        ContextSnapshot contextSnapshot,
        Guid runId,
        ArchitectureKnowledgeModel? knowledgeModel,
        ArchitectureKnowledgeModel? priorKnowledgeModel,
        IKnowledgeGraphService knowledgeGraphService,
        IArchitectureKnowledgeModelGraphProjector knowledgeModelGraphProjector,
        IGraphSnapshotRepository graphSnapshotRepository,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(contextSnapshot);
        ArgumentNullException.ThrowIfNull(knowledgeGraphService);
        ArgumentNullException.ThrowIfNull(knowledgeModelGraphProjector);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);

        if (ArchitectureKnowledgeModelProjectableElements.HasAny(knowledgeModel))
        {
            if (priorCommittedContext is not null
                && GraphSnapshotCanonicalFingerprint.AreEquivalentForReuse(
                    priorCommittedContext,
                    contextSnapshot,
                    priorKnowledgeModel,
                    knowledgeModel))
            {
                GraphSnapshot? priorGraph = await graphSnapshotRepository
                    .GetLatestByContextSnapshotIdAsync(scope, priorCommittedContext.SnapshotId, ct);

                if (priorGraph is not null)
                {
                    GraphSnapshot cloned = GraphSnapshotCloner.CloneForNewRun(priorGraph, contextSnapshot, runId);

                    return new GraphSnapshotResolutionResult(cloned, "cloned_knowledge_model_fingerprint_match");
                }
            }

            GraphSnapshot contextGraph = await knowledgeGraphService.BuildSnapshotAsync(contextSnapshot, ct);
            GraphSnapshot modelGraph = knowledgeModelGraphProjector.Project(knowledgeModel!, contextSnapshot, runId);
            GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

            return new GraphSnapshotResolutionResult(merged, "projected_from_knowledge_model");
        }

        return await GraphSnapshotReuseEvaluator.ResolveAsync(
            scope,
            priorCommittedContext,
            contextSnapshot,
            runId,
            knowledgeGraphService,
            graphSnapshotRepository,
            ct,
            priorKnowledgeModel,
            knowledgeModel);
    }
}
