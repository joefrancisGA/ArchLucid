namespace ArchLucid.Api.Models.Alerts;

public sealed class AlertActionLoopResponse
{
    public Guid AlertId
    {
        get;
        set;
    }

    public string Status
    {
        get;
        set;
    } = "";

    public Guid? RunId
    {
        get;
        set;
    }

    public DateTimeOffset? LastUpdatedUtc
    {
        get;
        set;
    }

    public string? ResolutionComment
    {
        get;
        set;
    }

    public IReadOnlyList<AlertDeliveryAttemptResponse> DeliveryAttempts
    {
        get;
        set;
    } = [];
}
