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
    ///     Least-privilege hosts should point this at the runtime app role (e.g. <c>[ArchLucidApp]</c>) so the audit/
    ///     sealed-evidence immutability probes validate the principal actually used at runtime; DDL that self-grants
    ///     permissions to that role must run under <see cref="DevelopmentTenantBootstrapConnectionString" /> instead.
    /// </summary>
    public string? DevelopmentTenantConnectionString { get; set; }

    /// <summary>
    ///     Optional: elevated connection used only to run schema DDL and the self-granting DENY/GRANT statements that
    ///     migrations issue against the least-privilege app role (e.g. migration 051/078/247). Falls back to
    ///     <see cref="DevelopmentTenantConnectionString" /> when unset, matching pre-split single-identity dev/CI hosts.
    /// </summary>
    public string? DevelopmentTenantBootstrapConnectionString { get; set; }
}
