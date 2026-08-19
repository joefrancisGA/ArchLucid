namespace ArchLucid.Api.Services;

/// <summary>HTTP probe for outbound webhook integrations (no durable audit).</summary>
public interface IOutboundWebhookDryRunService
{
    Task<OutboundWebhookDryRunResult> ProbeAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default);

    /// <summary>POSTs a synthetic <c>AuthorityRunCompleted</c> CloudEvents payload to the subscriber URL.</summary>
    Task<OutboundWebhookDryRunResult> ProbeAuthorityRunCompletedAsync(
        Uri targetUrl,
        string? sharedSecret,
        CancellationToken cancellationToken = default);
}
