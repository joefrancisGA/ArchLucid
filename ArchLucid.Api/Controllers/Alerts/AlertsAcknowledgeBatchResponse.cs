using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>Response for <c>POST /v1/alerts/acknowledge-batch</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class AlertsAcknowledgeBatchResponse
{
    public IReadOnlyList<AlertsAcknowledgeBatchItemResult> Results
    {
        get;
        set;
    } = [];
}
