using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;

/// <inheritdoc cref="IAuthorityPipelineGraphStage" />
public sealed class AuthorityPipelineGraphStage(
    IKnowledgeGraphService knowledgeGraphService,
    IGraphSnapshotRepository graphSnapshotRepository,
    IAuthorityPipelineStagePersistence stagePersistence,
    ILogger<AuthorityPipelineGraphStage> logger,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
    IArchitectureKnowledgeModelGraphProjector? knowledgeModelGraphProjector = null) : IAuthorityPipelineGraphStage
{
    private readonly IKnowledgeGraphService _knowledgeGraphService =
        knowledgeGraphService ?? throw new ArgumentNullException(nameof(knowledgeGraphService));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IAuthorityPipelineStagePersistence _stagePersistence =
        stagePersistence ?? throw new ArgumentNullException(nameof(stagePersistence));

    private readonly ILogger<AuthorityPipelineGraphStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureKnowledgeModelGraphProjector? _knowledgeModelGraphProjector =
        knowledgeModelGraphProjector;

    /// <inheritdoc />
    public async Task ExecuteAsync(AuthorityPipelineContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        RunRecord run = context.Run;

        GraphSnapshotResolutionResult? committedReuse = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            context.Scope,
            run.RunId,
            run.GraphSnapshotId,
            context.ContextSnapshot!.SnapshotId,
            _graphSnapshotRepository,
            cancellationToken,
            context.ContextSnapshot,
            await TryLoadKnowledgeModelAsync(context.Scope, run.RunId, cancellationToken),
            run.ArchitectureVersionId);

        if (committedReuse is not null)
        {
            context.GraphResolution = committedReuse;
            context.GraphSnapshot = committedReuse.Snapshot;

            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation(
                    "Authority pipeline graph reused: RunId={RunId}, GraphResolutionMode={GraphResolutionMode}, GraphSnapshotId={GraphSnapshotId}",
                    run.RunId,
                    committedReuse.ResolutionMode,
                    committedReuse.Snapshot.GraphSnapshotId);
            }

            if (run.GraphSnapshotId != committedReuse.Snapshot.GraphSnapshotId)
            {
                run.GraphSnapshotId = committedReuse.Snapshot.GraphSnapshotId;
                await _stagePersistence.UpdateRunAsync(run, context.UnitOfWork, cancellationToken);
            }

            return;
        }

        ArchitectureKnowledgeModel? knowledgeModel = await TryLoadKnowledgeModelAsync(context.Scope, run.RunId, cancellationToken);
        ArchitectureKnowledgeModel? priorKnowledgeModel = null;

        if (context.PriorCommittedContext is not null)
        {
            priorKnowledgeModel = await TryLoadKnowledgeModelAsync(
                context.Scope,
                context.PriorCommittedContext.RunId,
                cancellationToken);
        }

        GraphSnapshotResolutionResult graphResolution;

        if (knowledgeModel is not null && _knowledgeModelGraphProjector is not null)
        {
            graphResolution = await KnowledgeModelAwareGraphSnapshotResolver.ResolveAsync(
                context.Scope,
                context.PriorCommittedContext,
                context.ContextSnapshot!,
                run.RunId,
                knowledgeModel,
                priorKnowledgeModel,
                _knowledgeGraphService,
                _knowledgeModelGraphProjector,
                _graphSnapshotRepository,
                cancellationToken);
        }
        else
        {
            graphResolution = await GraphSnapshotReuseEvaluator.ResolveAsync(
                context.Scope,
                context.PriorCommittedContext,
                context.ContextSnapshot!,
                run.RunId,
                _knowledgeGraphService,
                _graphSnapshotRepository,
                cancellationToken,
                priorKnowledgeModel,
                knowledgeModel);
        }

        context.GraphResolution = graphResolution;
        GraphSnapshot graphSnapshot = graphResolution.Snapshot;
        context.GraphSnapshot = graphSnapshot;

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Authority pipeline graph resolved: RunId={RunId}, GraphResolutionMode={GraphResolutionMode}, GraphSnapshotId={GraphSnapshotId}",
                run.RunId,
                graphResolution.ResolutionMode,
                graphSnapshot.GraphSnapshotId);
        }

        await _stagePersistence.SaveGraphAsync(graphSnapshot, context.Scope, context.UnitOfWork, cancellationToken);

        StampGraphObservationFingerprints(context.ContextSnapshot!, knowledgeModel, graphSnapshot);

        run.GraphSnapshotId = graphSnapshot.GraphSnapshotId;
        await _stagePersistence.UpdateRunAsync(run, context.UnitOfWork, cancellationToken);
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadKnowledgeModelAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is null)
            return null;

        return await _knowledgeModelAccess
            .GetForRunAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);
    }

    private static void StampGraphObservationFingerprints(
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        GraphSnapshot graphSnapshot)
    {
        GraphNode? contextNode = graphSnapshot.Nodes
            .FirstOrDefault(node => string.Equals(node.NodeType, "ContextSnapshot", StringComparison.OrdinalIgnoreCase));

        if (contextNode is null)
            return;

        contextNode.Properties ??= new Dictionary<string, string>(StringComparer.Ordinal);

        contextNode.Properties[ArchLucid.KnowledgeGraph.ContextGraphPropertyKeys.ContextCanonicalFingerprint] =
            GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot);

        if (knowledgeModel is not null)
        {
            contextNode.Properties[ArchLucid.KnowledgeGraph.ContextGraphPropertyKeys.KnowledgeModelFingerprint] =
                GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel);
        }
    }
}
