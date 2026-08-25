using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

using Newtonsoft.Json.Linq;

using Stripe;
using Stripe.Checkout;

namespace ArchLucid.Persistence.Billing.Stripe;

public sealed partial class StripeBillingProvider(
    IOptionsMonitor<BillingOptions> billingOptions,
    IBillingLedger ledger,
    IBillingWebhookReplayGuard webhookReplayGuard,
    StripeBillingSubscriptionWebhookProcessor subscriptionWebhookProcessor,
    ILlmTenantWalletStripeWebhookProcessor walletWebhookProcessor,
    ILlmTenantWalletRepository walletRepository) : IBillingProvider
{
    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    private readonly StripeBillingSubscriptionWebhookProcessor _subscriptionWebhookProcessor =
        subscriptionWebhookProcessor ?? throw new ArgumentNullException(nameof(subscriptionWebhookProcessor));

    private readonly IBillingWebhookReplayGuard _webhookReplayGuard =
        webhookReplayGuard ?? throw new ArgumentNullException(nameof(webhookReplayGuard));

    private readonly ILlmTenantWalletStripeWebhookProcessor _walletWebhookProcessor =
        walletWebhookProcessor ?? throw new ArgumentNullException(nameof(walletWebhookProcessor));

    private readonly ILlmTenantWalletRepository _walletRepository =
        walletRepository ?? throw new ArgumentNullException(nameof(walletRepository));

    public string ProviderName => BillingProviderNames.Stripe;

    private static bool MetadataMatchesTenant(IReadOnlyDictionary<string, string>? metadata, Guid tenantId)
    {
        if (metadata is null)
            return false;

        if (!metadata.TryGetValue("tenant_id", out string? raw) || string.IsNullOrWhiteSpace(raw))
            return false;

        return Guid.TryParse(raw.Trim(), out Guid parsedTenantId) && parsedTenantId == tenantId;
    }
}
