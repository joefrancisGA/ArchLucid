using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>
///     Stripe-named provider that performs checkout ledger writes without calling Stripe HTTP APIs (CI-safe). Webhooks are
///     handled by the real Stripe billing provider (HTTP webhook controller) via
///     <c>BillingStripeWebhookController</c>.
/// </summary>
internal sealed class StripeCheckoutNoNetworkBillingProvider(IBillingLedger ledger) : IBillingProvider
{
    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    public string ProviderName => BillingProviderNames.Stripe;

    public async Task<BillingCheckoutResult> CreateCheckoutSessionAsync(
        BillingCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        string sessionId = "cs_test_e2e_" + Guid.NewGuid().ToString("N");
        string tierCode = BillingTierCode.FromCheckoutTier(request.TargetTier);

        await _ledger.UpsertPendingCheckoutAsync(
            request.TenantId,
            request.WorkspaceId,
            request.ProjectId,
            ProviderName,
            sessionId,
            tierCode,
            Math.Max(1, request.Seats),
            Math.Max(1, request.Workspaces),
            cancellationToken);

        return new BillingCheckoutResult
        {
            CheckoutUrl =
                $"https://checkout.stripe.com/c/pay/e2e_test#{Uri.EscapeDataString(sessionId)}",
            ProviderSessionId = sessionId,
            ExpiresUtc = TimeProvider.System.GetUtcNow().AddHours(1)
        };
    }

    public async Task<BillingPortalResult> CreateBillingPortalSessionAsync(
        BillingPortalRequest request,
        CancellationToken cancellationToken)
    {
        string? providerRef = await _ledger.TryGetProviderSubscriptionIdAsync(request.TenantId, cancellationToken);

        if (string.IsNullOrWhiteSpace(providerRef))
            throw new InvalidOperationException(
                "No Stripe customer is linked to this tenant yet. Complete checkout or add a payment method first.");

        string sessionId = "bps_test_e2e_" + Guid.NewGuid().ToString("N");

        return new BillingPortalResult
        {
            PortalUrl = $"https://billing.stripe.com/session/e2e_test#{Uri.EscapeDataString(sessionId)}",
            ProviderSessionId = sessionId
        };
    }

    public Task<BillingWebhookHandleResult> HandleWebhookAsync(
        BillingWebhookInbound inbound,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(
            BillingWebhookHandleResult.Rejected(
                $"{nameof(StripeCheckoutNoNetworkBillingProvider)} is checkout-only; use StripeBillingProvider for webhooks."));
    }
}
