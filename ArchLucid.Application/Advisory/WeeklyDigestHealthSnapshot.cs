namespace ArchLucid.Application.Advisory;

/// <summary>Weekly operating loop coverage derived from schedules, digest subscriptions, and executive email prefs.</summary>
public sealed class WeeklyDigestHealthSnapshot
{
    public int EnabledAdvisoryScheduleCount
    {
        get;
        init;
    }

    public DateTimeOffset? EarliestNextAdvisoryRunUtc
    {
        get;
        init;
    }

    public int DigestSubscriptionCount
    {
        get;
        init;
    }

    public int EnabledDigestSubscriptionCount
    {
        get;
        init;
    }

    public int DigestSubscriptionsByEmailChannel
    {
        get;
        init;
    }

    public int DigestSubscriptionsBySlackChannel
    {
        get;
        init;
    }

    public int DigestSubscriptionsByTeamsChannel
    {
        get;
        init;
    }

    public DateTimeOffset? LatestDigestSubscriptionDeliveryUtc
    {
        get;
        init;
    }

    public Guid? LatestArchitectureDigestId
    {
        get;
        init;
    }

    public DateTimeOffset? LatestArchitectureDigestGeneratedUtc
    {
        get;
        init;
    }

    public bool ExecutiveEmailDigestIsConfigured
    {
        get;
        init;
    }

    public bool ExecutiveEmailDigestEnabled
    {
        get;
        init;
    }

    public int ExecutiveDigestRecipientCount
    {
        get;
        init;
    }

    public string ExecutiveDigestIanaTimeZoneId
    {
        get;
        init;
    } = "UTC";

    public int ExecutiveDigestDayOfWeek
    {
        get;
        init;
    }

    public int ExecutiveDigestHourOfDay
    {
        get;
        init;
    }

    /// <summary>Human-readable gaps for empty-state UX (no PII).</summary>
    public IReadOnlyList<string> SetupGaps
    {
        get;
        init;
    } = [];
}
