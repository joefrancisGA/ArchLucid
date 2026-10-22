namespace ArchLucid.Application.WeeklySponsorReport;

using ArchLucid.Contracts.User;

/// <summary>Global schedule for automated weekly run-summary one-pager emails to commercial tenants.</summary>
public sealed class WeeklySponsorReportOptions
{
    public const string SectionName = "WeeklySponsorReport";

    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>IANA timezone for the weekly send window (default US Eastern).</summary>
    public string IanaTimeZoneId
    {
        get;
        set;
    } = IanaTimeZonePreferenceValues.Default;

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
