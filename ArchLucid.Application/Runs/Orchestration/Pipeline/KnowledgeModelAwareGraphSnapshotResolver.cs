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

        if (knowledgeModel is not null && HasProjectableElements(knowledgeModel))
        {
            GraphSnapshot contextGraph = await knowledgeGraphService.BuildSnapshotAsync(contextSnapshot, ct);
            GraphSnapshot modelGraph = knowledgeModelGraphProjector.Project(knowledgeModel, contextSnapshot, runId);
            GraphSnapshot merged = MergeGraphSnapshots(contextGraph, modelGraph);

            return new GraphSnapshotResolutionResult(merged, "projected_from_knowledge_model");
        }

        return await GraphSnapshotReuseEvaluator.ResolveAsync(
            scope,
            priorCommittedContext,
            contextSnapshot,
            runId,
            knowledgeGraphService,
            graphSnapshotRepository,
            ct);
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
