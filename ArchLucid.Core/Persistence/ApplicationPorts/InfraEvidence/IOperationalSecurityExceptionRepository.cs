namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperationalSecurityExceptionRepository
{
    Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default);

    Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid exceptionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid exceptionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid exceptionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveExceptionForFindingAsync(
        Guid tenantId,
        Guid findingId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);
}
