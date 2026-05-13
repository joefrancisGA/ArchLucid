namespace ArchLucid.Persistence.Tenancy;

/// <summary>Reads optional per-tenant overrides for externally facing first-value report headers.</summary>
public interface ITenantFirstValueReportBrandingRepository
{
    /// <summary>Returns logo URL / company columns from <c>dbo.Tenants</c> when present.</summary>
    Task<TenantFirstValueReportBrandingRow?> TryGetAsync(Guid tenantId, CancellationToken cancellationToken);
}

/// <summary>Raw persistence row fragments (sanitize before injecting into Markdown/PDF).</summary>
public sealed record TenantFirstValueReportBrandingRow(string? BrandingLogoUrl, string? BrandingCompanyName);
