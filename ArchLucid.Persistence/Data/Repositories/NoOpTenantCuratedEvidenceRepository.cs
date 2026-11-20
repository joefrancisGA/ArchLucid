using System.Data;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class NoOpTenantCuratedEvidenceRepository : ITenantCuratedEvidenceRepository
{
    public Task<IReadOnlyList<TenantCuratedEvidenceEntryRow>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<TenantCuratedEvidenceEntryRow>>([]);
    }

    public Task<Guid> InsertPromotedEntryAsync(
        Guid tenantId,
        string entryType,
        string catalogEntryId,
        string title,
        string description,
        string rationale,
        string sourceResultId,
        CancellationToken cancellationToken = default,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(Guid.NewGuid());
    }
}
