namespace ArchLucid.Core.Configuration;

/// <summary>Bound from <c>ArchLucid:SqlTopology</c>.</summary>
public sealed class SqlTopologyOptions
{
    public const string SectionPath = "ArchLucid:SqlTopology";

    public SqlTopologyMode Mode { get; set; } = SqlTopologyMode.SingleCatalog;

    /// <summary>
    ///     Connection string template for tenant catalogs in <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs" />.
    ///     Use the same authentication surface as the runtime app; <see cref="ITenantDatabaseResolver" /> switches
    ///     <c>Initial Catalog</c> (or equivalent) to the binding's logical database name.
    /// </summary>
    public string TenantCatalogConnectionStringTemplate { get; set; } = string.Empty;

    /// <summary>Short-lived cache for binding lookups; explicit invalidation is preferred after provisioning writes.</summary>
    public int TenantBindingCacheSeconds { get; set; } = 60;

    /// <summary>
    ///     Optional: migrate/schema-bootstrap this catalog at API startup (local integration / single-tenant dev hosts).
    /// </summary>
    public string? DevelopmentTenantConnectionString { get; set; }
}
