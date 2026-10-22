namespace ArchLucid.Api.Models.Alerts;

public sealed class AlertDeliveryAttemptResponse
{
    public string ChannelType
    {
        get;
        set;
    } = "";

    public string Status
    {
        get;
        set;
    } = "";

    public DateTimeOffset AttemptedUtc
    {
        get;
        set;
    }

    public string DestinationRedacted
    {
        get;
        set;
    } = "";

    public string? ErrorMessage
    {
        get;
        set;
    }
}
