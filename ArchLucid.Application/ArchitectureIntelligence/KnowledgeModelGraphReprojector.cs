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

        if (run?.ContextSnapshotId is not Guid contextSnapshotId)
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

        await _graphSnapshotRepository
            .SaveAsync(merged, cancellationToken)
            .ConfigureAwait(false);

        run.GraphSnapshotId = merged.GraphSnapshotId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }
}
