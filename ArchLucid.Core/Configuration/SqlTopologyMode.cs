namespace ArchLucid.Core.Configuration;

/// <summary>How product SQL catalogs are arranged: one shared catalog vs system + per-tenant catalogs.</summary>
public enum SqlTopologyMode
{
    /// <summary>Default: <c>ConnectionStrings:ArchLucid</c> hosts all planes (legacy greenfield / local dev).</summary>
    SingleCatalog = 0,

    /// <summary>System catalog plus dedicated product catalog per tenant (routing via <c>TenantDatabaseBindings</c>).</summary>
    SystemWithPerTenantCatalogs = 1,
}
