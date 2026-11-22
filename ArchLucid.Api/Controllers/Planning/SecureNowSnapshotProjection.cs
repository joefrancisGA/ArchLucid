using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Controllers.Planning;

/// <summary>
/// FND-011 read-only projection of a graph already loaded through an authorized,
/// tenant-scoped and sealed-manifest-guarded read. This class is not an authorization
/// decision point, nor an HTTP endpoint.
/// </summary>
public static class SecureNowSnapshotProjection
{
    public static SecureNowSnapshotEnvelope Project(
        GraphSnapshot snapshot,
        ScopeContext authenticatedScope,
        Guid resolvedRunId,
        DateTimeOffset evaluatedAt,
        TimeSpan? freshnessLimit = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(authenticatedScope);
        if (authenticatedScope.TenantId == Guid.Empty ||
            authenticatedScope.WorkspaceId == Guid.Empty ||
            authenticatedScope.ProjectId == Guid.Empty)
            throw new ArgumentException("Authenticated tenant, workspace and project are required.", nameof(authenticatedScope));
        if (resolvedRunId == Guid.Empty || snapshot.RunId != resolvedRunId)
            throw new ArgumentException("Resolved run does not match persisted graph.", nameof(resolvedRunId));
        if (snapshot.SchemaVersion != 1 || snapshot.GraphSnapshotId == Guid.Empty ||
            snapshot.ContextSnapshotId == Guid.Empty)
            throw new ArgumentException("Unsupported or incomplete persisted graph.", nameof(snapshot));
        if (freshnessLimit is { } limit && limit < TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(freshnessLimit));

        DateTimeOffset captured = new(DateTime.SpecifyKind(snapshot.CreatedUtc.ToUniversalTime(), DateTimeKind.Utc));
        if (captured > evaluatedAt.ToUniversalTime())
            throw new ArgumentException("Evaluation cannot precede capture.", nameof(evaluatedAt));

        HashSet<string> ids = new(StringComparer.Ordinal);
        foreach (GraphNode node in snapshot.Nodes)
        {
            if (string.IsNullOrWhiteSpace(node.NodeId) || string.IsNullOrWhiteSpace(node.NodeType) || !ids.Add(node.NodeId))
                throw new ArgumentException("Invalid or duplicate graph node.", nameof(snapshot));
        }
        foreach (GraphEdge edge in snapshot.Edges)
        {
            if (!ids.Contains(edge.FromNodeId) || !ids.Contains(edge.ToNodeId) ||
                string.IsNullOrWhiteSpace(edge.EdgeType))
                throw new ArgumentException("Dangling or invalid graph edge.", nameof(snapshot));
        }

        string freshness = freshnessLimit is null ? "unknown"
            : evaluatedAt.ToUniversalTime() - captured <= freshnessLimit ? "current" : "stale";

        return new SecureNowSnapshotEnvelope
        {
            SchemaVersion = "1.0.0",
            TenantId = authenticatedScope.TenantId,
            WorkspaceId = authenticatedScope.WorkspaceId,
            ProjectId = authenticatedScope.ProjectId,
            RunId = resolvedRunId,
            GraphSnapshotId = snapshot.GraphSnapshotId,
            SourceGraphSchemaVersion = snapshot.SchemaVersion,
            CapturedAt = captured,
            Freshness = new SnapshotFreshness(evaluatedAt.ToUniversalTime(), freshness),
            Lineage = new SnapshotLineage(snapshot.ContextSnapshotId, []),
            Nodes = snapshot.Nodes.Select(n => new SnapshotNode(n.NodeId, n.NodeType, [])).ToArray(),
            Edges = snapshot.Edges.Select(e => new SnapshotEdge(e.FromNodeId, e.ToNodeId, e.EdgeType, [])).ToArray(),
            ReadOnly = true,
            Warnings = snapshot.Warnings.ToArray()
        };
    }
}

public sealed class SecureNowSnapshotEnvelope
{
    public required string SchemaVersion { get; init; }
    public required Guid TenantId { get; init; }
    public required Guid WorkspaceId { get; init; }
    public required Guid ProjectId { get; init; }
    public required Guid RunId { get; init; }
    public required Guid GraphSnapshotId { get; init; }
    public required int SourceGraphSchemaVersion { get; init; }
    public required DateTimeOffset CapturedAt { get; init; }
    public required SnapshotFreshness Freshness { get; init; }
    public required SnapshotLineage Lineage { get; init; }
    public required SnapshotNode[] Nodes { get; init; }
    public required SnapshotEdge[] Edges { get; init; }
    public required bool ReadOnly { get; init; }
    public required string[] Warnings { get; init; }
}

public sealed record SnapshotFreshness(DateTimeOffset EvaluatedAt, string Status);
public sealed record SnapshotLineage(Guid ContextSnapshotId, string[] SourceEvidenceRefs);
public sealed record SnapshotNode(string NodeId, string NodeType, string[] EvidenceRefs);
public sealed record SnapshotEdge(string FromNodeId, string ToNodeId, string EdgeType, string[] EvidenceRefs);
