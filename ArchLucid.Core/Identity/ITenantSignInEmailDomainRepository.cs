namespace ArchLucid.Core.Identity;

public interface ITenantSignInEmailDomainRepository
{
    Task<TenantSignInEmailDomainRecord?> FindByNormalizedDomainAsync(
        string normalizedDomain,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantSignInEmailDomainRecord>> ListByTenantIdAsync(
        Guid tenantId,
        CancellationToken cancellationToken);

    Task<TenantSignInEmailDomainRecord?> TryGetAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken);

    Task InsertAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken);

    Task UpdateAsync(TenantSignInEmailDomainRecord record, CancellationToken cancellationToken);
}
