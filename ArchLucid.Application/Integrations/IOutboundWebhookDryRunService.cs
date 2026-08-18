namespace ArchLucid.Application.Integrations;

/// <summary>HTTP probe for outbound webhook integrations (no durable audit).</summary>
public interface IOutboundWebhookDryRunService
{
    Task<OutboundWebhookDryRunResult> ProbeAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default);

    Task<OutboundWebhookDryRunResult> ProbeAuthorityRunCompletedAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default);
}
