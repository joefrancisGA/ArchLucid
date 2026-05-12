namespace ArchLucid.Application.WeeklyArchitectureDigest;

/// <summary>Configuration for the scaffold weekly architecture findings digest loop (mock log delivery only).</summary>
public sealed class WeeklyArchitectureDigestOptions
{
    public const string SectionName = "WeeklyArchitectureDigest";

    /// <summary>When false the leader-elected loop sleeps but skips repository queries (job CLI still runs).</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Findings snapshots created on or after <c>UtcNow - LookbackDays</c>.</summary>
    public int LookbackDays
    {
        get;
        set;
    } = 7;

    /// <summary>Number of Critical findings surfaced in the mock payload (remaining matches stay in totals only).</summary>
    public int TopCriticalFindingCount
    {
        get;
        set;
    } = 3;

    /// <summary>Upper bound fetched from SQL before projecting the top-<see cref="TopCriticalFindingCount"/> summaries.</summary>
    public int CriticalFindingSampleFetchCap
    {
        get;
        set;
    } = 100;

    /// <summary>Leader sleep between iterations.</summary>
    public int PollingIntervalHours
    {
        get;
        set;
    } = 24;
}
