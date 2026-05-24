namespace ArchLucid.Core.Configuration;

/// <summary>
///     Background pre-warming of the tenant-scoped executive ROI summary hot-path cache.
/// </summary>
public sealed class ExecutiveRoiCacheWarmupOptions
{
    public const string SectionPath = "ExecutiveRoi:CacheWarmup";

    /// <summary>When false, the hosted service is not registered.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Delay between warmup passes (1–168 hours).</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;

    /// <summary>Absolute cache TTL for warmed ROI summaries (seconds).</summary>
    public int CacheTtlSeconds
    {
        get;
        set;
    } = 3600;
}
