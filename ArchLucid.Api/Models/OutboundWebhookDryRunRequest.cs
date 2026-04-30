
namespace ArchLucid.Api.Models;

/// <summary>POST body for <c>/v1/webhooks/dry-run</c> — probes a subscriber URL without persistence.</summary>
public sealed class OutboundWebhookDryRunRequest
{
    public required Uri TargetUrl
    {
        get;
        init;
    }

    public string? SharedSecret
    {
        get;
        init;
    }
}
