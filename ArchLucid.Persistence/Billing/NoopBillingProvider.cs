using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

namespace ArchLucid.Persistence.Billing;

public sealed class NoopBillingProvider(IBillingLedger ledger) : IBillingProvider
{
    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    public string ProviderName => BillingProviderNames.Noop;

    public async Task<BillingCheckoutResult> CreateCheckoutSessionAsync(
        BillingCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        string sessionId = $"noop_sess_{Guid.NewGuid():N}";
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
            CheckoutUrl = $"https://billing.archlucid.local/noop-checkout?session={sessionId}",
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

        string sessionId = $"noop_portal_{Guid.NewGuid():N}";

        return new BillingPortalResult
        {
            PortalUrl = $"https://billing.archlucid.local/noop-portal?session={sessionId}",
            ProviderSessionId = sessionId
        };
    }

    public Task<BillingWebhookHandleResult> HandleWebhookAsync(
        BillingWebhookInbound inbound,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(BillingWebhookHandleResult.Rejected("Noop billing provider does not accept webhooks."));
    }
}
