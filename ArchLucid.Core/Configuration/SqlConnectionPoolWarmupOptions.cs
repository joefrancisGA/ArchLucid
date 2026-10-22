namespace ArchLucid.Core.Configuration;

/// <summary>
///     One-shot SQL connection-pool warm-up after host start (opens N connections, SELECT 1, returns to pool).
/// </summary>
public sealed class SqlConnectionPoolWarmupOptions
{
    public const string SectionPath = "ArchLucid:SqlConnectionPoolWarmup";

    /// <summary>When false, the hosted service is not registered.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>How many connections to open (clamped 1–32; should stay below MaxPoolSize).</summary>
    public int ConnectionCount
    {
        get;
        set;
    } = 4;
}
