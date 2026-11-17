using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Interfaces;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Reprojects Γ from κ after operator-side κ mutations (clarification, improve-loop).
/// </summary>
public interface IKnowledgeModelGraphReprojector
{
    Task TryReprojectForRunAsync(
        ScopeContext scope,
        Guid runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken = default);
}

public sealed class KnowledgeModelGraphReprojector(
    IRunRepository runRepository,
    IContextSnapshotRepository contextSnapshotRepository,
    IGraphSnapshotRepository graphSnapshotRepository,
    IKnowledgeGraphService knowledgeGraphService,
    IArchitectureKnowledgeModelGraphProjector knowledgeModelGraphProjector) : IKnowledgeModelGraphReprojector
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IContextSnapshotRepository _contextSnapshotRepository =
        contextSnapshotRepository ?? throw new ArgumentNullException(nameof(contextSnapshotRepository));

    private readonly IGraphSnapshotRepository _graphSnapshotRepository =
        graphSnapshotRepository ?? throw new ArgumentNullException(nameof(graphSnapshotRepository));

    private readonly IKnowledgeGraphService _knowledgeGraphService =
        knowledgeGraphService ?? throw new ArgumentNullException(nameof(knowledgeGraphService));

    private readonly IArchitectureKnowledgeModelGraphProjector _knowledgeModelGraphProjector =
        knowledgeModelGraphProjector ?? throw new ArgumentNullException(nameof(knowledgeModelGraphProjector));

    public async Task TryReprojectForRunAsync(
        ScopeContext scope,
        Guid runId,
        ArchitectureKnowledgeModel model,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(model);

        if (runId == Guid.Empty || !ArchitectureKnowledgeModelProjectableElements.HasAny(model))
            return;

        ArchLucid.Persistence.Models.RunRecord? run = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        // A sealed run's evidence anchors are immutable. κ updates after commitment
        // may produce a new architecture revision, but must not retarget this run's Γ.

        if (run is null
            || run.GoldenManifestId.HasValue
            || string.Equals(run.LegacyRunStatus, "Committed", StringComparison.OrdinalIgnoreCase))
            return;

        if (run.ContextSnapshotId is not Guid contextSnapshotId)
            return;

        ContextSnapshot? contextSnapshot = await _contextSnapshotRepository
            .GetByIdAsync(scope.ToReadScope(), contextSnapshotId, cancellationToken)
            .ConfigureAwait(false);

        if (contextSnapshot is null)
            return;

        GraphSnapshot contextGraph = await _knowledgeGraphService
            .BuildSnapshotAsync(contextSnapshot, cancellationToken)
            .ConfigureAwait(false);
        GraphSnapshot modelGraph = _knowledgeModelGraphProjector.Project(model, contextSnapshot, runId);
        GraphSnapshot merged = GraphSnapshotKnowledgeModelMerger.Merge(contextGraph, modelGraph);

        // Re-check after the potentially long projection so concurrent finalization
        // cannot be overwritten using the earlier, unsealed run snapshot.
        ArchLucid.Persistence.Models.RunRecord? latestRun = await _runRepository
            .GetByIdAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        if (latestRun is null
            || latestRun.GoldenManifestId.HasValue
            || string.Equals(latestRun.LegacyRunStatus, "Committed", StringComparison.OrdinalIgnoreCase)
            || latestRun.ContextSnapshotId != contextSnapshotId
            || latestRun.GraphSnapshotId != run.GraphSnapshotId)
            return;

        await _graphSnapshotRepository
            .SaveAsync(merged, cancellationToken)
            .ConfigureAwait(false);

        latestRun.GraphSnapshotId = merged.GraphSnapshotId;
        await _runRepository.UpdateAsync(latestRun, cancellationToken).ConfigureAwait(false);
    }
}
