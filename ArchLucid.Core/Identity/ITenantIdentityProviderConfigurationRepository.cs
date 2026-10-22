namespace ArchLucid.Core.Identity;

public interface ITenantIdentityProviderConfigurationRepository
{
    Task<TenantIdentityProviderConfigurationRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task UpsertAsync(TenantIdentityProviderConfigurationRecord record, CancellationToken cancellationToken);
}
