using ArchLucid.Api.Services;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Services.Billing;

/// <summary>Probes configured Azure Marketplace webhook reachability for onboarding checks.</summary>
public sealed class MarketplaceWebhookConnectivityService(
    IOptions<BillingOptions> billingOptions,
    IOutboundWebhookDryRunService probe)
{
    private readonly BillingOptions _billingOptions =
        billingOptions?.Value ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly IOutboundWebhookDryRunService _probe =
        probe ?? throw new ArgumentNullException(nameof(probe));

    public async Task<OutboundWebhookDryRunResult> TestConfiguredWebhookAsync(CancellationToken cancellationToken)
    {
        string? webhookUrl = _billingOptions.AzureMarketplace.WebhookUrl?.Trim();

        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            return new OutboundWebhookDryRunResult
            {
                TransportSucceeded = false,
                Error = "Billing:AzureMarketplace:WebhookUrl is not configured.",
            };
        }

        if (!Uri.TryCreate(webhookUrl, UriKind.Absolute, out Uri? destination))
        {
            return new OutboundWebhookDryRunResult
            {
                TransportSucceeded = false,
                Error = "Billing:AzureMarketplace:WebhookUrl is not a valid absolute URI.",
            };
        }

        return await _probe.ProbeAsync(
            destination,
            sharedSecret: null,
            cancellationToken).ConfigureAwait(false);
    }
}
