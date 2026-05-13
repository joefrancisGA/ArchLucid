namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Durable <c>POST …/commit</c> idempotency keyed by tenant scope, run id, and <c>Idempotency-Key</c> hash.</summary>
public interface ICommitRunIdempotencyRepository
{
    Task<CommitRunIdempotencyLookup?> TryGetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string runId,
        byte[] idempotencyKeyHash,
        CancellationToken cancellationToken = default);

    Task<bool> TryInsertAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string runId,
        byte[] idempotencyKeyHash,
        byte[] requestFingerprint,
        CancellationToken cancellationToken = default);
}
