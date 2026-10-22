namespace ArchLucid.Persistence.Tenancy;

/// <summary>Per-tenant key/value overrides in <c>dbo.TenantSettings</c>.</summary>
public interface ITenantSettingsRepository
{
    Task<string?> TryGetAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken);

    Task UpsertAsync(Guid tenantId, string settingKey, string settingValue, CancellationToken cancellationToken);

    Task DeleteAsync(Guid tenantId, string settingKey, CancellationToken cancellationToken);
}
