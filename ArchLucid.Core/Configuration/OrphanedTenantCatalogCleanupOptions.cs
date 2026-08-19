namespace ArchLucid.Core.Configuration;

/// <summary>
///     Leader-elected purge of tenant SQL catalogs after erasure quarantine (assessment Batch 5 / TB orphaned catalogs).
/// </summary>
public sealed class OrphanedTenantCatalogCleanupOptions
{
    public const string SectionName = "OrphanedTenantCatalogCleanup";

    /// <summary>When false, the cleanup loop is idle.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Minimum days since <see cref="Tenancy.TenantRecord.TenantErasureRequestedUtc" /> before purge is eligible.</summary>
    public int RetentionDays
    {
        get;
        set;
    } = 30;

    /// <summary>Maximum tenants purged per interval (throttles DTU on the control-plane catalog).</summary>
    public int MaxCatalogsPerHour
    {
        get;
        set;
    } = 5;

    /// <summary>Minutes between cleanup scans (clamped in hosted worker).</summary>
    public int IntervalMinutes
    {
        get;
        set;
    } = 60;
}
