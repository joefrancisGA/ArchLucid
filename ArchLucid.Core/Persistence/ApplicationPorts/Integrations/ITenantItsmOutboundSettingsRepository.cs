namespace ArchLucid.Persistence.Integrations;

/// <summary>Per-tenant ITSM outbound overrides (nullable row → deployment defaults only).</summary>
public interface ITenantItsmOutboundSettingsRepository
{
    Task<TenantItsmOutboundSettings?> TryGetAsync(Guid tenantId, CancellationToken ct);
}
