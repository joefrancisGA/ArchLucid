namespace ArchLucid.Application.DataConsistency;

/// <summary>
/// Optional bounded auto soft-archive for runs whose <c>ArchitectureRequestId</c> is missing from
/// <c>dbo.ArchitectureRequests</c> (dev / solo-operator hygiene; clears <c>data_consistency</c> readiness).
/// </summary>
public sealed class MissingArchitectureRequestAutoRemediationOptions
{
    public const string SectionName = "DataConsistency:AutoRemediateMissingArchitectureRequestRuns";

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

    /// <summary>
    /// Minimum age before a missing-request orphan is eligible for auto-archive (avoids racing in-flight CreateRun).
    /// </summary>
    public int MinAgeMinutes
    {
        get;
        set;
    } = 15;
}
