namespace ArchLucid.Core.Configuration;

/// <summary>Elastic-pool warm catalog pool for signup fast path (TB-018).</summary>
public sealed class WarmTenantCatalogOptions
{
    public const string SectionPath = "ArchLucid:WarmTenantCatalog";

    public bool Enabled
    {
        get;
        init;
    }

    /// <summary>Target count of unclaimed standbys to maintain.</summary>
    public int TargetDepth
    {
        get;
        init;
    } = 3;

    /// <summary>Replenish loop interval in minutes.</summary>
    public int ReplenishIntervalMinutes
    {
        get;
        init;
    } = 30;
}
