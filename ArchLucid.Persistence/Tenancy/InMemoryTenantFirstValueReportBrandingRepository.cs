namespace ArchLucid.Persistence.Tenancy;

/// <summary>In-memory hosts omit tenant branding columns; first-value reports use product defaults.</summary>
public sealed class InMemoryTenantFirstValueReportBrandingRepository : ITenantFirstValueReportBrandingRepository
{
    public Task<TenantFirstValueReportBrandingRow?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult<TenantFirstValueReportBrandingRow?>(null);
    }
}
