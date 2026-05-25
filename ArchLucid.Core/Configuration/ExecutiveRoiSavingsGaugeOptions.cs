namespace ArchLucid.Core.Configuration;

/// <summary>
///     Background refresh of <c>archlucid_tenant_estimated_savings_usd</c> from executive ROI rollups.
/// </summary>
public sealed class ExecutiveRoiSavingsGaugeOptions
{
    public const string SectionPath = "ExecutiveRoi:SavingsGauge";

    /// <summary>When false, the hosted service is not registered.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Delay between gauge refresh passes (1–1440 minutes).</summary>
    public int RefreshIntervalMinutes
    {
        get;
        set;
    } = 15;

    /// <summary>
    ///     When true, emit per-tenant series with <c>tenant_id</c> in addition to the platform aggregate.
    ///     Default false to control Prometheus cardinality (mirrors <see cref="LlmTelemetryOptions.RecordPerTenantTokens" />).
    /// </summary>
    public bool RecordPerTenantSavings
    {
        get;
        set;
    }
}
