namespace ArchLucid.Application.Alerts;

/// <summary>Alert lifecycle plus routing/delivery attempts with destinations redacted for safe operator surfacing.</summary>
public sealed class AlertActionLoopSnapshot
{
    public Guid AlertId
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = "";

    public Guid? RunId
    {
        get;
        init;
    }

    public DateTimeOffset? LastUpdatedUtc
    {
        get;
        init;
    }

    public string? ResolutionComment
    {
        get;
        init;
    }

    public IReadOnlyList<AlertDeliveryAttemptSummary> DeliveryAttempts
    {
        get;
        init;
    } = [];
}
