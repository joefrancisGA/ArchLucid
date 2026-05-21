namespace ArchLucid.Persistence.Data.Repositories;

public sealed class NoOpTenantCuratedEvidenceRepository : ITenantCuratedEvidenceRepository
{
    public Task<IReadOnlyList<TenantCuratedEvidenceEntryRow>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<TenantCuratedEvidenceEntryRow>>([]);

    public Task<Guid> InsertPromotedEntryAsync(
        Guid tenantId,
        string entryType,
        string catalogEntryId,
        string title,
        string description,
        string rationale,
        string sourceResultId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(Guid.NewGuid());
}
