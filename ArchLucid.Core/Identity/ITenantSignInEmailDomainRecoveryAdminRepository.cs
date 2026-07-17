namespace ArchLucid.Core.Identity;

public interface ITenantSignInEmailDomainRecoveryAdminRepository
{
    Task<IReadOnlyList<TenantSignInEmailDomainRecoveryAdminRecord>> ListByDomainAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken);

    Task<bool> IsRecoveryAdminAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedEmail,
        CancellationToken cancellationToken);

    Task InsertAsync(TenantSignInEmailDomainRecoveryAdminRecord record, CancellationToken cancellationToken);

    Task DeleteAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        CancellationToken cancellationToken);

    Task MarkAuthenticationVerifiedAsync(
        Guid tenantId,
        string normalizedDomain,
        string normalizedRecoveryAdminEmail,
        DateTimeOffset verifiedUtc,
        CancellationToken cancellationToken);
}
