namespace ArchLucid.Core.Identity;

public interface IPlatformTenantAuthRecoveryGrantRepository
{
    Task<PlatformTenantAuthRecoveryGrantRecord> InsertAsync(
        PlatformTenantAuthRecoveryGrantRecord grant,
        CancellationToken cancellationToken);

    Task<PlatformTenantAuthRecoveryGrantRecord?> GetActiveByTenantAndDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        DateTimeOffset nowUtc,
        CancellationToken cancellationToken);

    Task<PlatformTenantAuthRecoveryGrantRecord?> GetByIdAsync(
        Guid grantId,
        CancellationToken cancellationToken);

    Task<bool> RevokeAsync(
        Guid grantId,
        string revokedByActorId,
        DateTimeOffset revokedUtc,
        CancellationToken cancellationToken);

    Task MarkTenantNotifiedAsync(
        Guid grantId,
        DateTimeOffset notifiedUtc,
        CancellationToken cancellationToken);
}
