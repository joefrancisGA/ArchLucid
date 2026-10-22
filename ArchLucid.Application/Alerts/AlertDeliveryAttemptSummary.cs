namespace ArchLucid.Application.Alerts;

public sealed class AlertDeliveryAttemptSummary
{
    public string ChannelType
    {
        get;
        init;
    } = "";

    public string Status
    {
        get;
        init;
    } = "";

    public DateTimeOffset AttemptedUtc
    {
        get;
        init;
    }

    public string DestinationRedacted
    {
        get;
        init;
    } = "";

    public string? ErrorMessage
    {
        get;
        init;
    }
}
