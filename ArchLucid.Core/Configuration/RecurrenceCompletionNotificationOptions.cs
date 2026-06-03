namespace ArchLucid.Core.Configuration;

/// <summary>Stickiness recurrence completion email + in-app re-engagement (TB-261).</summary>
public sealed class RecurrenceCompletionNotificationOptions
{
    public const string SectionName = "Stickiness:RecurrenceCompletionNotification";

    public bool Enabled
    {
        get;
        set;
    } = true;
}
