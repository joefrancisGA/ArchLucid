namespace ArchLucid.Api.Models.Tenancy;

public sealed class WeeklyDigestHealthResponse
{
    public int EnabledAdvisoryScheduleCount
    {
        get;
        set;
    }

    public DateTimeOffset? EarliestNextAdvisoryRunUtc
    {
        get;
        set;
    }

    public int DigestSubscriptionCount
    {
        get;
        set;
    }

    public int EnabledDigestSubscriptionCount
    {
        get;
        set;
    }

    public int DigestSubscriptionsByEmailChannel
    {
        get;
        set;
    }

    public int DigestSubscriptionsBySlackChannel
    {
        get;
        set;
    }

    public int DigestSubscriptionsByTeamsChannel
    {
        get;
        set;
    }

    public DateTimeOffset? LatestDigestSubscriptionDeliveryUtc
    {
        get;
        set;
    }

    public Guid? LatestArchitectureDigestId
    {
        get;
        set;
    }

    public DateTimeOffset? LatestArchitectureDigestGeneratedUtc
    {
        get;
        set;
    }

    public bool ExecutiveEmailDigestIsConfigured
    {
        get;
        set;
    }

    public bool ExecutiveEmailDigestEnabled
    {
        get;
        set;
    }

    public int ExecutiveDigestRecipientCount
    {
        get;
        set;
    }

    public string ExecutiveDigestIanaTimeZoneId
    {
        get;
        set;
    } = "UTC";

    public int ExecutiveDigestDayOfWeek
    {
        get;
        set;
    }

    public int ExecutiveDigestHourOfDay
    {
        get;
        set;
    }

    public bool SponsorEmailDigestIsConfigured
    {
        get;
        set;
    }

    public bool SponsorEmailDigestEnabled
    {
        get;
        set;
    }

    public int SponsorDigestRecipientCount
    {
        get;
        set;
    }

    public string SponsorDigestIanaTimeZoneId
    {
        get;
        set;
    } = "UTC";

    public int SponsorDigestDayOfWeek
    {
        get;
        set;
    }

    public int SponsorDigestHourOfDay
    {
        get;
        set;
    }

    public IReadOnlyList<string> SetupGaps
    {
        get;
        set;
    } = [];
}
