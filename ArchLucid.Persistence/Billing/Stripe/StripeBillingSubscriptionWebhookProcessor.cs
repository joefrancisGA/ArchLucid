using System.Globalization;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Stripe;
using Stripe.Checkout;

namespace ArchLucid.Persistence.Billing.Stripe;

/// <summary>Stripe subscription lifecycle webhook mutations (renewal, dunning, cancellation).</summary>
public sealed class StripeBillingSubscriptionWebhookProcessor(
    IBillingLedger ledger,
    BillingWebhookTrialActivator trialActivator,
    IMarketplaceChangePlanWebhookMutationHandler changePlanWebhookMutationHandler,
    IAuditService auditService)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IMarketplaceChangePlanWebhookMutationHandler _changePlanWebhookMutationHandler =
        changePlanWebhookMutationHandler ?? throw new ArgumentNullException(nameof(changePlanWebhookMutationHandler));

    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    private readonly BillingWebhookTrialActivator _trialActivator =
        trialActivator ?? throw new ArgumentNullException(nameof(trialActivator));

    public async Task HandleCheckoutSessionCompletedAsync(
        Session session,
        string rawBody,
        CancellationToken cancellationToken)
    {
        if (session.Metadata is null)
            return;

        if (!TryParseGuid(session.Metadata, "tenant_id", out Guid tenantId) ||
            !TryParseGuid(session.Metadata, "workspace_id", out Guid workspaceId) ||
            !TryParseGuid(session.Metadata, "project_id", out Guid projectId))
            return;

        BillingCheckoutTier checkoutTier = ParseCheckoutTier(session.Metadata, "tier");
        string tierCode = BillingTierCode.FromCheckoutTier(checkoutTier);
        int seats = ParsePositiveInt(session.Metadata, "seats", 1);
        int workspaces = ParsePositiveInt(session.Metadata, "workspaces", 1);
        string subscriptionId = session.SubscriptionId ?? session.Id;

        string planToken = checkoutTier switch
        {
            BillingCheckoutTier.Architect => "archlucid-stripe-architect",
            BillingCheckoutTier.Pro => "archlucid-stripe-pro",
            BillingCheckoutTier.Enterprise => "archlucid-stripe-enterprise",
            _ => "archlucid-stripe-team"
        };

        using JsonDocument planDoc = JsonDocument.Parse(
            JsonSerializer.Serialize(new Dictionary<string, string> { ["planId"] = planToken }));

        await _changePlanWebhookMutationHandler.HandleAsync(tenantId, planDoc.RootElement, rawBody, cancellationToken);

        await _trialActivator.OnSubscriptionActivatedAsync(
            tenantId,
            workspaceId,
            projectId,
            BillingProviderNames.Stripe,
            subscriptionId,
            tierCode,
            BillingTierCode.CheckoutTierLabel(checkoutTier),
            seats,
            workspaces,
            rawBody,
            cancellationToken);
    }

    public async Task HandleSubscriptionUpdatedAsync(
        Subscription subscription,
        string rawBody,
        CancellationToken cancellationToken)
    {
        Guid? tenantId = await ResolveTenantIdAsync(subscription.Metadata, subscription.Id, cancellationToken);

        if (tenantId is null || tenantId == Guid.Empty)
            return;

        string status = subscription.Status?.Trim() ?? string.Empty;

        if (IsActiveSubscriptionStatus(status))
        {
            await _ledger.ReinstateSubscriptionAsync(tenantId.Value, cancellationToken);
            await LogLifecycleAsync(tenantId.Value, AuditEventTypes.BillingSubscriptionReinstated, subscription.Id, status, cancellationToken);

            return;
        }

        if (IsPastDueSubscriptionStatus(status))
        {
            await _ledger.SuspendSubscriptionAsync(tenantId.Value, cancellationToken);
            await LogLifecycleAsync(tenantId.Value, AuditEventTypes.BillingSubscriptionSuspended, subscription.Id, status, cancellationToken);

            return;
        }

        if (string.Equals(status, "canceled", StringComparison.OrdinalIgnoreCase))
        {
            await _ledger.CancelSubscriptionAsync(tenantId.Value, cancellationToken);
            await LogLifecycleAsync(tenantId.Value, AuditEventTypes.BillingSubscriptionCanceled, subscription.Id, status, cancellationToken);
        }
    }

    public async Task HandleSubscriptionDeletedAsync(
        Subscription subscription,
        string rawBody,
        CancellationToken cancellationToken)
    {
        Guid? tenantId = await ResolveTenantIdAsync(subscription.Metadata, subscription.Id, cancellationToken);

        if (tenantId is null || tenantId == Guid.Empty)
            return;

        await _ledger.CancelSubscriptionAsync(tenantId.Value, cancellationToken);
        await LogLifecycleAsync(
            tenantId.Value,
            AuditEventTypes.BillingSubscriptionCanceled,
            subscription.Id,
            "deleted",
            cancellationToken);
    }

    public async Task HandleInvoicePaymentFailedAsync(
        Invoice invoice,
        string rawBody,
        CancellationToken cancellationToken)
    {
        string? subscriptionId = ResolveInvoiceSubscriptionId(invoice);

        if (string.IsNullOrWhiteSpace(subscriptionId))
            return;

        Guid? tenantId = await _ledger.TryResolveTenantIdByProviderSubscriptionIdAsync(subscriptionId, cancellationToken);

        if (tenantId is null || tenantId == Guid.Empty)
            return;

        await _ledger.SuspendSubscriptionAsync(tenantId.Value, cancellationToken);
        await LogLifecycleAsync(
            tenantId.Value,
            AuditEventTypes.BillingSubscriptionSuspended,
            subscriptionId,
            "invoice.payment_failed",
            cancellationToken);
    }

    private static string? ResolveInvoiceSubscriptionId(Invoice invoice)
    {
        string? fromParent = invoice.Parent?.SubscriptionDetails?.SubscriptionId;

        if (!string.IsNullOrWhiteSpace(fromParent))
            return fromParent.Trim();

        return invoice.Parent?.SubscriptionDetails?.Subscription?.Id;
    }

    private async Task<Guid?> ResolveTenantIdAsync(
        IReadOnlyDictionary<string, string>? metadata,
        string providerSubscriptionId,
        CancellationToken cancellationToken)
    {
        Guid? fromLedger =
            await _ledger.TryResolveTenantIdByProviderSubscriptionIdAsync(providerSubscriptionId, cancellationToken);

        if (fromLedger is not null && fromLedger != Guid.Empty)
        {
            if (TryParseGuid(metadata, "tenant_id", out Guid fromMetadata) && fromMetadata != fromLedger.Value)
                return null;

            return fromLedger;
        }

        if (TryParseGuid(metadata, "tenant_id", out Guid metadataOnly))
            return metadataOnly;

        return null;
    }

    [InformationalAudit]
    private async Task LogLifecycleAsync(
        Guid tenantId,
        string eventType,
        string providerSubscriptionId,
        string stripeStatus,
        CancellationToken cancellationToken)
    {
        string actor = $"billing:{BillingProviderNames.Stripe}";

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = tenantId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        provider = BillingProviderNames.Stripe,
                        providerSubscriptionId,
                        stripeStatus
                    })
            },
            cancellationToken);
    }

    private static bool IsActiveSubscriptionStatus(string status)
    {
        return string.Equals(status, "active", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "trialing", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsPastDueSubscriptionStatus(string status)
    {
        return string.Equals(status, "past_due", StringComparison.OrdinalIgnoreCase)
               || string.Equals(status, "unpaid", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryParseGuid(IReadOnlyDictionary<string, string>? metadata, string key, out Guid value)
    {
        value = Guid.Empty;

        if (metadata is null)
            return false;

        if (!metadata.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return false;

        return Guid.TryParse(raw.Trim(), out value);
    }

    private static BillingCheckoutTier ParseCheckoutTier(IReadOnlyDictionary<string, string> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return BillingCheckoutTier.Team;

        return raw.Trim() switch
        {
            "Architect" => BillingCheckoutTier.Architect,
            "Pro" => BillingCheckoutTier.Pro,
            "Enterprise" => BillingCheckoutTier.Enterprise,
            _ => BillingCheckoutTier.Team
        };
    }

    private static int ParsePositiveInt(IReadOnlyDictionary<string, string> metadata, string key, int fallback)
    {
        if (!metadata.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return fallback;

        return int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int n) && n > 0
            ? n
            : fallback;
    }
}
