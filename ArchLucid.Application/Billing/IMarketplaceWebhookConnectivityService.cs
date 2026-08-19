using ArchLucid.Application.Integrations;

namespace ArchLucid.Application.Billing;

public interface IMarketplaceWebhookConnectivityService
{
    Task<OutboundWebhookDryRunResult> TestConfiguredWebhookAsync(CancellationToken cancellationToken);
}
