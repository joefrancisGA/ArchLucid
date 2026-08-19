namespace ArchLucid.Persistence.Data.Repositories;

public interface IIdempotencyRecordRepository
{
    Task<IdempotencyRecordRow?> TryGetAsync(Guid tenantId, string idempotencyKey, CancellationToken cancellationToken = default);

    Task<bool> TryInsertAsync(
        Guid tenantId,
        string idempotencyKey,
        int statusCode,
        string responseBody,
        CancellationToken cancellationToken = default);
}
