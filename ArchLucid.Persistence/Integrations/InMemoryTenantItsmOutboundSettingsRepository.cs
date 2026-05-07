using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Integrations;

/// <summary>In-memory tenant ITSM outbound settings for tests and <c>StorageProvider=InMemory</c>.</summary>
public sealed class InMemoryTenantItsmOutboundSettingsRepository : ITenantItsmOutboundSettingsRepository
{
    private readonly ConcurrentDictionary<Guid, TenantItsmOutboundSettings> _byTenant = new();

    public Task<TenantItsmOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken ct)
    {
        _ = ct;

        return tenantId == Guid.Empty
            ? throw new ArgumentException("tenantId is required.", nameof(tenantId))
            : Task.FromResult(_byTenant.GetValueOrDefault(tenantId));
    }

    /// <summary>Test / dev helper — not used by production SQL hosts.</summary>
    public void Upsert(Guid tenantId, TenantItsmOutboundSettings settings)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentNullException.ThrowIfNull(settings);

        _ = _byTenant.AddOrUpdate(tenantId, settings, (_, _) => settings);
    }
}
