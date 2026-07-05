namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>Response for <c>POST /v1/alerts/acknowledge-batch</c>.</summary>
public sealed class AlertsAcknowledgeBatchResponse
{
    public IReadOnlyList<AlertsAcknowledgeBatchItemResult> Results
    {
        get;
        set;
    } = [];
}
