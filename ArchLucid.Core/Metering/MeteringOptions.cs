namespace ArchLucid.Core.Metering;

/// <summary>Feature flags for usage metering persistence.</summary>
public sealed class MeteringOptions
{
    public const string SectionName = "Metering";

    /// <summary>When false, <see cref="IUsageMeteringService" /> no-ops (except summaries return empty).</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>
    ///     Background flush interval for batched API request metering (TB-582). Totals may lag by up to this window.
    ///     Clamped to 1–60 seconds.
    /// </summary>
    public int ApiRequestBatchFlushIntervalSeconds
    {
        get;
        set;
    } = 5;

    /// <summary>Maximum events per batch flush (TB-582). Clamped to 1–500.</summary>
    public int ApiRequestBatchMaxSize
    {
        get;
        set;
    } = 64;

    /// <summary>Clamps batch settings to safe operating bounds.</summary>
    public void Normalize()
    {
        ApiRequestBatchFlushIntervalSeconds = Math.Clamp(ApiRequestBatchFlushIntervalSeconds, 1, 60);
        ApiRequestBatchMaxSize = Math.Clamp(ApiRequestBatchMaxSize, 1, 500);
    }
}
