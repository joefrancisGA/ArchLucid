namespace ArchLucid.Application.DataConsistency;

public sealed class DataConsistencyReconciliationOptions
{
    public const string SectionName = "DataConsistency";

    /// <summary>Background reconciliation cadence; default 6 hours.</summary>
    public int ReconciliationIntervalMinutes
    {
        get;
        set;
    } = 360;

    /// <summary>Delay before the first reconciliation pass (startup spacing). Default 120 seconds.</summary>
    public int InitialDelaySeconds
    {
        get;
        set;
    } = 120;

    /// <summary>
    /// When true (production default), stale in-flight run warnings degrade <c>/health/ready</c>.
    /// When false, stale runs remain visible in reconciliation metrics/logs but do not block readiness.
    /// </summary>
    public bool StaleInFlightRunsBlockReadiness
    {
        get;
        set;
    } = true;
}
