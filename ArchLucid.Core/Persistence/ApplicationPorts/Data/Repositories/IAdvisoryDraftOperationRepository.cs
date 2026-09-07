namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Reads and writes <c>dbo.AdvisoryDraftOperations</c> for tenant-scoped advisory draft async ops (DR-14).</summary>
public interface IAdvisoryDraftOperationRepository
{
    /// <summary>Returns the operation for the scope/id pair, or null when no row exists.</summary>
    Task<AdvisoryDraftOperationRow?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid operationId,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Inserts a pending row. Returns <see langword="false" /> when the operation id already exists
    ///     (idempotent create — replica-safe unique key).
    /// </summary>
    Task<bool> TryInsertPendingAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken);

    /// <summary>Updates progress, terminal state, and optional result payload for an existing row.</summary>
    Task UpdateAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken);

    /// <summary>Loads a row by operation id when the caller only has the opaque draft operation id.</summary>
    Task<AdvisoryDraftOperationRow?> GetByOperationIdAsync(
        Guid operationId,
        CancellationToken cancellationToken);
}
