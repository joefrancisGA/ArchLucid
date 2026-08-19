namespace ArchLucid.Core.Tenancy;

public static class TenantDatabaseNaming
{
    /// <summary>
    ///     Deterministic logical database name for a tenant catalog.
    /// </summary>
    public static string SqlLogicalNameForTenant(Guid tenantId) => "archlucid_tenant_" + tenantId.ToString("N");
}
