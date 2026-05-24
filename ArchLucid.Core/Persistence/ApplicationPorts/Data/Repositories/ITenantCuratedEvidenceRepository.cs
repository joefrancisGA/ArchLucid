namespace ArchLucid.Persistence.Data.Repositories;

public interface ITenantCuratedEvidenceRepository
{
    Task<IReadOnlyList<TenantCuratedEvidenceEntryRow>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<Guid> InsertPromotedEntryAsync(
        Guid tenantId,
        string entryType,
        string catalogEntryId,
        string title,
        string description,
        string rationale,
        string sourceResultId,
        CancellationToken cancellationToken = default);
}
