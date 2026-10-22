namespace ArchLucid.Application.DataConsistency;

/// <summary>Optional bounded auto soft-archive for stale in-flight runs (dev / solo-operator hygiene).</summary>
public sealed class StaleInFlightAutoRemediationOptions
{
    public const string SectionName = "DataConsistency:AutoRemediateStaleInFlightRuns";

    public bool Enabled
    {
        get;
        set;
    }

    public int IntervalMinutes
    {
        get;
        set;
    } = 60;

    public int MaxRowsPerPass
    {
        get;
        set;
    } = 50;
}
