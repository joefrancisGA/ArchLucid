using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>In-memory <see cref="ICommitRunIdempotencyRepository"/> for tests and InMemory storage hosts.</summary>
public sealed class InMemoryCommitRunIdempotencyRepository : ICommitRunIdempotencyRepository
{
    private readonly ConcurrentDictionary<string, CommitRunIdempotencyLookup> _rows = new();

    /// <inheritdoc />
    public Task<CommitRunIdempotencyLookup?> TryGetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string runId,
        byte[] idempotencyKeyHash,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);
        string key = BuildKey(tenantId, workspaceId, projectId, runId, idempotencyKeyHash);

        return Task.FromResult(_rows.TryGetValue(key, out CommitRunIdempotencyLookup? lookup) ? lookup : null);
    }

    /// <inheritdoc />
    public Task<bool> TryInsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string runId,
        byte[] idempotencyKeyHash,
        byte[] requestFingerprint,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(idempotencyKeyHash);
        ArgumentNullException.ThrowIfNull(requestFingerprint);
        string key = BuildKey(tenantId, workspaceId, projectId, runId, idempotencyKeyHash);

        CommitRunIdempotencyLookup row =
            new() { RequestFingerprint = (byte[])requestFingerprint.Clone(), };

        bool added = _rows.TryAdd(key, row);

        return Task.FromResult(added);
    }

    private static string BuildKey(Guid tenantId, Guid workspaceId, Guid projectId, string runId, byte[] idempotencyKeyHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return $"{tenantId:D}|{workspaceId:D}|{projectId:D}|{runId}|{Convert.ToHexString(idempotencyKeyHash)}";
    }
}
