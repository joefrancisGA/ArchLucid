namespace ArchLucid.Core.Configuration;

/// <summary>Background purge of <c>dbo.Runs</c> rows marked <c>IsSample = 1</c> past TTL (OS-1b).</summary>
public sealed class SampleRunPurgeOptions
{
    public const string SectionName = "SampleRunPurge";

    /// <summary>When false, the TTL hosted loop does nothing.</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Minimum wall-clock interval between TTL purge passes.</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;

    /// <summary>Sample runs with <c>CreatedUtc</c> older than this many days are eligible for TTL purge. Clamped to 1–30.</summary>
    public int TtlDays
    {
        get;
        set;
    } = 7;

    /// <summary>Rows deleted per <c>dbo.SampleRunPurgeBatch</c> call. Clamped to 1–10000.</summary>
    public int BatchSize
    {
        get;
        set;
    } = 500;
}
