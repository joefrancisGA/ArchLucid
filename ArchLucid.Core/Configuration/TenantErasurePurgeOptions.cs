namespace ArchLucid.Core.Configuration;

/// <summary>
///     Leader-elected purge of tenants past erasure quarantine (after legal hold clears). Mirrors
///     <see cref="ArchitectureProjectRetentionPurgeOptions" /> scheduling defaults.
/// </summary>
public sealed class TenantErasurePurgeOptions
{
    public const string SectionName = "TenantErasure";

    /// <summary>When false, the purge loop is idle.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Days after <c>OffboardedUtc</c> before <c>ErasureEligibleUtc</c> is reached (operator offboard).</summary>
    public int QuarantineDays
    {
        get;
        set;
    } = 30;

    /// <summary>Hours between purge scans (clamped in hosted worker).</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;

    /// <summary>Maximum tenants to dequeue per scan.</summary>
    public int BatchSize
    {
        get;
        set;
    } = 5;
}
