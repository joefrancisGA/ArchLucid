using ArchLucid.Api.Models;

namespace ArchLucid.Api.Services;

/// <summary>Outcome of a synthetic webhook ping for a routing subscription.</summary>
public sealed class WebhookSubscriptionTestResult
{
    public bool IsSuccess
    {
        get;
        init;
    }

    public int? ErrorStatusCode
    {
        get;
        init;
    }

    public string? ErrorDetail
    {
        get;
        init;
    }

    public string? ErrorProblemType
    {
        get;
        init;
    }

    public OutboundWebhookDryRunResponse? Response
    {
        get;
        init;
    }
}
