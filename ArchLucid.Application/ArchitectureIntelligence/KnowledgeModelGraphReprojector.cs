using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Persistence.Ports;
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

        if (runId == Guid.Empty || !HasProjectableElements(model))
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
        GraphSnapshot merged = MergeGraphSnapshots(contextGraph, modelGraph);

        await _graphSnapshotRepository
            .SaveAsync(merged, cancellationToken)
            .ConfigureAwait(false);

        run.GraphSnapshotId = merged.GraphSnapshotId;
        await _runRepository.UpdateAsync(run, cancellationToken).ConfigureAwait(false);
    }

    private static bool HasProjectableElements(ArchitectureKnowledgeModel model) =>
        model.Elements.Any(element => element.Kind is ArchitectureElementKind.Component
            or ArchitectureElementKind.Interface
            or ArchitectureElementKind.DataFlow
            or ArchitectureElementKind.TrustBoundary
            or ArchitectureElementKind.DeploymentTopology
            or ArchitectureElementKind.ComplianceObligation
            or ArchitectureElementKind.FunctionalRequirement);

    private static GraphSnapshot MergeGraphSnapshots(GraphSnapshot contextGraph, GraphSnapshot modelGraph)
    {
        HashSet<string> modelNodeIds = modelGraph.Nodes
            .Select(static node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        List<GraphNode> mergedNodes = [.. modelGraph.Nodes];

        foreach (GraphNode contextNode in contextGraph.Nodes)
        {
            if (!modelNodeIds.Contains(contextNode.NodeId))
                mergedNodes.Add(contextNode);
        }

        HashSet<string> edgeKeys = modelGraph.Edges
            .Select(static edge => $"{edge.FromNodeId}|{edge.ToNodeId}|{edge.EdgeType}")
            .ToHashSet(StringComparer.Ordinal);

        List<GraphEdge> mergedEdges = [.. modelGraph.Edges];

        foreach (GraphEdge contextEdge in contextGraph.Edges)
        {
            string key = $"{contextEdge.FromNodeId}|{contextEdge.ToNodeId}|{contextEdge.EdgeType}";

            if (!edgeKeys.Contains(key))
                mergedEdges.Add(contextEdge);
        }

        List<string> warnings = [.. modelGraph.Warnings, .. contextGraph.Warnings];

        return new GraphSnapshot
        {
            GraphSnapshotId = modelGraph.GraphSnapshotId,
            ContextSnapshotId = modelGraph.ContextSnapshotId,
            RunId = modelGraph.RunId,
            CreatedUtc = modelGraph.CreatedUtc,
            Nodes = mergedNodes,
            Edges = mergedEdges,
            Warnings = warnings,
        };
    }
}
