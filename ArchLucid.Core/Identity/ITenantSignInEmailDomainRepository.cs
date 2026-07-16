namespace ArchLucid.Core.Identity;

public interface ITenantSignInEmailDomainRepository
{
    Task<TenantSignInEmailDomainRecord?> FindByNormalizedDomainAsync(
        string normalizedDomain,
        CancellationToken cancellationToken);
}
