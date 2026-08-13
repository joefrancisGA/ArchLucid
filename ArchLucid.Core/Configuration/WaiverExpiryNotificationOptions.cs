namespace ArchLucid.Core.Configuration;

/// <summary>Scheduled waiver / risk-exception expiry scan and escalating reminders (TB-2193).</summary>
public sealed class WaiverExpiryNotificationOptions
{
    public const string SectionName = "Stickiness:WaiverExpiryNotification";

    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Clamped to 1–168 hours by the hosted service. Daily matches the reminder cadence granularity.</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;
}
