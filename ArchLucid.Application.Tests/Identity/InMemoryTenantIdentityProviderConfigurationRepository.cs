using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Tests.Identity;

internal sealed class InMemoryTenantIdentityProviderConfigurationRepository : ITenantIdentityProviderConfigurationRepository
{
    private readonly Dictionary<Guid, TenantIdentityProviderConfigurationRecord> _byTenant = [];

    public void Seed(TenantIdentityProviderConfigurationRecord record) => _byTenant[record.TenantId] = record;

    public Task<TenantIdentityProviderConfigurationRecord?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byTenant.TryGetValue(tenantId, out TenantIdentityProviderConfigurationRecord? record);

        return Task.FromResult(record);
    }

    public Task UpsertAsync(TenantIdentityProviderConfigurationRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byTenant[record.TenantId] = record;

        return Task.CompletedTask;
    }
}
