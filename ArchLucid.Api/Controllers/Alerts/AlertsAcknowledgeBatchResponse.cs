using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Controllers.Alerts;

/// <summary>Per-alert outcome for batch acknowledge.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class AlertsAcknowledgeBatchItemResult
{
    public Guid AlertId
    {
        get;
        set;
    }

    public bool Succeeded
    {
        get;
        set;
    }

    public string? Message
    {
        get;
        set;
    }
}

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
