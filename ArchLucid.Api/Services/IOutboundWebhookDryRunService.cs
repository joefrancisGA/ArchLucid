
namespace ArchLucid.Api.Services;

/// <summary>HTTP probe for outbound webhook integrations (no durable audit).</summary>
public interface IOutboundWebhookDryRunService
{
    Task<OutboundWebhookDryRunResult> ProbeAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default);
}
