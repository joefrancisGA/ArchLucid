namespace ArchLucid.Application.Tenancy;

/// <summary>Post-cutover projection refresh orchestration outcome (TB-2046).</summary>
public sealed class TenantMigrationProjectionRefreshResult
{
    public int RetrievalIndexingRowsProcessed
    {
        get;
        init;
    }

    public int RoiCacheKeysInvalidated
    {
        get;
        init;
    }

    public int TenantScopeCachesInvalidated
    {
        get;
        init;
    }
}
