namespace ArchLucid.Application.WeeklyExecutiveSummary;

/// <summary>Global schedule for automated weekly run-summary one-pager emails to commercial tenants.</summary>
public sealed class WeeklyExecutiveSummaryOptions
{
    public const string SectionName = "WeeklyExecutiveSummary";

    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>IANA timezone for the weekly send window (default UTC).</summary>
    public string IanaTimeZoneId
    {
        get;
        set;
    } = "UTC";

    /// <summary>Day-of-week in the configured timezone (0 = Sunday, 1 = Monday, …).</summary>
    public int DayOfWeek
    {
        get;
        set;
    } = 1;

    /// <summary>Hour (0–23) in the configured timezone when delivery may run.</summary>
    public int HourOfDay
    {
        get;
        set;
    } = 8;
}
