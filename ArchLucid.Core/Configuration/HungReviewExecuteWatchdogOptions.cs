namespace ArchLucid.Core.Configuration;

/// <summary>Server watchdog for reviews stuck in execute (robustness #5).</summary>
public sealed class HungReviewExecuteWatchdogOptions
{
    public const string SectionName = "DataConsistency:HungReviewExecuteWatchdog";

    public bool Enabled
    {
        get;
        set;
    }

    public int StaleHours
    {
        get;
        set;
    } = 2;

    public int IntervalMinutes
    {
        get;
        set;
    } = 30;

    public int MaxRowsPerPass
    {
        get;
        set;
    } = 50;
}
