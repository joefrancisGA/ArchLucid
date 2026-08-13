namespace ArchLucid.Core.Tenancy;

/// <summary>Read-only tenant lookups against <c>dbo.Tenants</c> (tenant plane and control-plane catalog).</summary>
public interface ITenantDirectoryReader
{
    Task<TenantRecord?> GetByIdAsync(Guid tenantId, CancellationToken ct);

    /// <summary>
    ///     Reads <c>dbo.Tenants</c> from the control-plane catalog (system SQL) when tenant-plane routing returns no row.
    /// </summary>
    Task<TenantRecord?> GetByIdFromControlPlaneCatalogAsync(Guid tenantId, CancellationToken ct);

    /// <summary>
    ///     Reads <c>dbo.Tenants</c> by slug from the control-plane catalog (system SQL) for registration duplicate gates.
    /// </summary>
    Task<TenantRecord?> GetBySlugFromControlPlaneCatalogAsync(string slug, CancellationToken ct);

    /// <summary>
    ///     Reads <c>dbo.Tenants</c> by normalized organization display name (<c>UPPER(TRIM(Name))</c>) for registration duplicate gates.
    /// </summary>
    Task<TenantRecord?> GetByNormalizedOrganizationNameAsync(string normalizedOrganizationName, CancellationToken ct);

    Task<TenantRecord?> GetBySlugAsync(string slug, CancellationToken ct);

    /// <summary>Lookup by Entra directory tenant id (<c>tid</c> claim) when linked.</summary>
    Task<TenantRecord?> GetByEntraTenantIdAsync(Guid entraTenantId, CancellationToken ct);

    Task<IReadOnlyList<TenantRecord>> ListAsync(CancellationToken ct);
}
