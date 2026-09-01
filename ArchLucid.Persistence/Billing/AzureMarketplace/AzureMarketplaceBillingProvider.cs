using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Billing.AzureMarketplace;

public sealed partial class AzureMarketplaceBillingProvider(
    IOptionsMonitor<BillingOptions> billingOptions,
    IBillingLedger ledger,
    IBillingWebhookReplayGuard webhookReplayGuard,
    BillingWebhookTrialActivator trialActivator,
    IMarketplaceWebhookTokenVerifier tokenVerifier,
    IHttpClientFactory httpClientFactory,
    IMarketplaceChangePlanWebhookMutationHandler changePlanWebhookMutationHandler,
    IMarketplaceChangeQuantityWebhookMutationHandler changeQuantityWebhookMutationHandler) : IBillingProvider
{
    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly IMarketplaceChangePlanWebhookMutationHandler _changePlanWebhookMutationHandler =
        changePlanWebhookMutationHandler ?? throw new ArgumentNullException(nameof(changePlanWebhookMutationHandler));

    private readonly IMarketplaceChangeQuantityWebhookMutationHandler _changeQuantityWebhookMutationHandler =
        changeQuantityWebhookMutationHandler ??
        throw new ArgumentNullException(nameof(changeQuantityWebhookMutationHandler));

    private readonly IHttpClientFactory _httpClientFactory =
        httpClientFactory ?? throw new ArgumentNullException(nameof(httpClientFactory));

    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    private readonly IBillingWebhookReplayGuard _webhookReplayGuard =
        webhookReplayGuard ?? throw new ArgumentNullException(nameof(webhookReplayGuard));

    private readonly IMarketplaceWebhookTokenVerifier _tokenVerifier =
        tokenVerifier ?? throw new ArgumentNullException(nameof(tokenVerifier));

    private readonly BillingWebhookTrialActivator _trialActivator =
        trialActivator ?? throw new ArgumentNullException(nameof(trialActivator));

    public string ProviderName => BillingProviderNames.AzureMarketplace;
}
