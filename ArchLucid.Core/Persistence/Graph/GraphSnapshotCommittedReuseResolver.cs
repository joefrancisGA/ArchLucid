using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.Graph;

/// <summary>
///     Reuses an already-persisted graph for a run when the run header or an orphan save references it (TB-042).
///     Wave-2: reuse requires observational equality with the current admitted context (κ fingerprint when present).
/// </summary>
public static class GraphSnapshotCommittedReuseResolver
{
    private const string ContextCanonicalFingerprintKey = "contextCanonicalFingerprint";
    private const string KnowledgeModelFingerprintKey = "knowledgeModelFingerprint";
    /// <summary>
    ///     Returns a committed graph when <paramref name="runGraphSnapshotId" /> loads successfully, or when the latest graph
    ///     for <paramref name="contextSnapshotId" /> belongs to <paramref name="runId" /> (save succeeded but header update
    ///     failed).
    /// </summary>
    public static async Task<GraphSnapshotResolutionResult?> TryResolveAsync(
        ScopeContext scope,
        Guid runId,
        Guid? runGraphSnapshotId,
        Guid contextSnapshotId,
        IGraphSnapshotRepository graphSnapshotRepository,
        CancellationToken ct,
        ContextSnapshot? contextSnapshot = null,
        ArchitectureKnowledgeModel? knowledgeModel = null)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(graphSnapshotRepository);

        if (runGraphSnapshotId is Guid headerGraphId)
        {
            GraphSnapshot? fromHeader = await graphSnapshotRepository.GetByIdAsync(scope, headerGraphId, ct);

            if (fromHeader is not null
                && IsObservationallyEqual(contextSnapshotId, contextSnapshot, knowledgeModel, fromHeader))
            {
                return new GraphSnapshotResolutionResult(fromHeader, "reused_from_run_header");
            }
        }

        // When the run header FK is cleared (e.g. sibling κ mutation), do not resurrect a stale orphan graph.
        if (runGraphSnapshotId is null)
            return null;

        GraphSnapshot? latestForContext = await graphSnapshotRepository
            .GetLatestByContextSnapshotIdAsync(scope, contextSnapshotId, ct);

        if (latestForContext is not null
            && latestForContext.RunId == runId
            && IsObservationallyEqual(contextSnapshotId, contextSnapshot, knowledgeModel, latestForContext))
        {
            return new GraphSnapshotResolutionResult(latestForContext, "reused_from_orphan_save");
        }

        return null;
    }

    private static bool IsObservationallyEqual(
        Guid contextSnapshotId,
        ContextSnapshot? contextSnapshot,
        ArchitectureKnowledgeModel? knowledgeModel,
        GraphSnapshot graph)
    {
        if (graph.ContextSnapshotId != contextSnapshotId)
            return false;

        if (contextSnapshot is null)
            return true;

        string expectedContextFingerprint = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot);
        string? storedContextFingerprint = ReadContextProperty(graph, ContextCanonicalFingerprintKey);

        if (!string.IsNullOrEmpty(storedContextFingerprint)
            && !string.Equals(storedContextFingerprint, expectedContextFingerprint, StringComparison.Ordinal))
        {
            return false;
        }

        string expectedModelFingerprint =
            GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel);
        string? storedModelFingerprint = ReadContextProperty(graph, KnowledgeModelFingerprintKey);

        if (!string.IsNullOrEmpty(storedModelFingerprint)
            && !string.Equals(storedModelFingerprint, expectedModelFingerprint, StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }

    private static string? ReadContextProperty(GraphSnapshot graph, string key)
    {
        GraphNode? contextNode = graph.Nodes
            .FirstOrDefault(node => string.Equals(node.NodeType, "ContextSnapshot", StringComparison.OrdinalIgnoreCase));

        if (contextNode?.Properties is null)
            return null;

        return contextNode.Properties.TryGetValue(key, out string? value) ? value : null;
    }
}
