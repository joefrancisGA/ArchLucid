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

public sealed partial class StripeBillingProvider
{
    public async Task<BillingWebhookHandleResult> HandleWebhookAsync(
        BillingWebhookInbound inbound,
        CancellationToken cancellationToken)
    {
        StripeBillingWebhookRoute route = inbound.StripeWebhookRoute ?? StripeBillingWebhookRoute.Subscription;
        BillingOptions billing = _billingOptions.CurrentValue;
        string? signingSecret = ResolveWebhookSigningSecret(billing, route);

        if (string.IsNullOrWhiteSpace(signingSecret) || string.IsNullOrWhiteSpace(inbound.StripeSignatureHeader))
        {
            return BillingWebhookHandleResult.Rejected(
                "Stripe webhook signing secret or Stripe-Signature header is missing.");
        }

        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(
                inbound.RawBody,
                inbound.StripeSignatureHeader,
                signingSecret,
                300,
                false);
        }
        catch (StripeException ex)
        {
            return BillingWebhookHandleResult.Rejected(ex.Message);
        }

        if (await _webhookReplayGuard.HasSeenAsync(ProviderName, stripeEvent.Id, cancellationToken).ConfigureAwait(false))
        {
            return BillingWebhookHandleResult.ReplayRejected(
                $"Stripe webhook event '{stripeEvent.Id}' was already processed within the replay protection window.");
        }

        bool inserted = await _ledger.TryInsertWebhookEventAsync(
            stripeEvent.Id,
            ProviderName,
            stripeEvent.Type,
            inbound.RawBody,
            cancellationToken);

        if (!inserted)
        {
            string? prior = await _ledger.GetWebhookEventResultStatusAsync(stripeEvent.Id, cancellationToken);

            if (BillingWebhookLedgerReplayPolicy.ShouldRejectDuplicateLedgerEntry(prior))
            {
                return BillingWebhookHandleResult.ReplayRejected(
                    $"Stripe webhook event '{stripeEvent.Id}' was already processed.");
            }
        }

        try
        {
            bool handled = await DispatchStripeWebhookEventAsync(route, stripeEvent, inbound.RawBody, cancellationToken);

            if (!handled)
            {
                return BillingWebhookHandleResult.Rejected(
                    $"Stripe event type '{stripeEvent.Type}' is not handled on the {route} webhook route.");
            }

            await _ledger.MarkWebhookProcessedAsync(stripeEvent.Id, "Processed", cancellationToken);
            await _webhookReplayGuard.RememberAsync(ProviderName, stripeEvent.Id, cancellationToken).ConfigureAwait(false);

            return BillingWebhookHandleResult.Ok();
        }
        catch (Exception)
        {
            await _ledger.MarkWebhookProcessedAsync(stripeEvent.Id, "Failed", cancellationToken);

            throw;
        }
    }
    private async Task<bool> DispatchStripeWebhookEventAsync(
        StripeBillingWebhookRoute route,
        Event stripeEvent,
        string rawBody,
        CancellationToken cancellationToken)
    {
        if (IsStripeConnectivityEvent(stripeEvent.Type))
            return true;

        if (route == StripeBillingWebhookRoute.Wallet)
        {
            if (!stripeEvent.Type.StartsWith("payment_intent.", StringComparison.OrdinalIgnoreCase))
                return false;

            await HandleWalletPaymentIntentEventAsync(stripeEvent, cancellationToken).ConfigureAwait(false);

            return true;
        }

        return await DispatchSubscriptionWebhookEventAsync(stripeEvent, rawBody, cancellationToken);
    }
    private async Task<bool> DispatchSubscriptionWebhookEventAsync(
        Event stripeEvent,
        string rawBody,
        CancellationToken cancellationToken)
    {
        if (string.Equals(stripeEvent.Type, "checkout.session.completed", StringComparison.OrdinalIgnoreCase))
        {
            Session? session = TryGetCheckoutSessionFromEvent(stripeEvent);

            if (session is not null)
            {
                await _subscriptionWebhookProcessor.HandleCheckoutSessionCompletedAsync(
                    session,
                    rawBody,
                    cancellationToken);
            }

            return true;
        }

        if (string.Equals(stripeEvent.Type, "customer.subscription.updated", StringComparison.OrdinalIgnoreCase))
        {
            Subscription? subscription = TryGetSubscriptionFromEvent(stripeEvent);

            if (subscription is not null)
            {
                await _subscriptionWebhookProcessor.HandleSubscriptionUpdatedAsync(
                    subscription,
                    rawBody,
                    cancellationToken);
            }

            return true;
        }

        if (string.Equals(stripeEvent.Type, "customer.subscription.deleted", StringComparison.OrdinalIgnoreCase))
        {
            Subscription? subscription = TryGetSubscriptionFromEvent(stripeEvent);

            if (subscription is not null)
            {
                await _subscriptionWebhookProcessor.HandleSubscriptionDeletedAsync(
                    subscription,
                    rawBody,
                    cancellationToken);
            }

            return true;
        }

        if (string.Equals(stripeEvent.Type, "invoice.payment_failed", StringComparison.OrdinalIgnoreCase))
        {
            Invoice? invoice = TryGetInvoiceFromEvent(stripeEvent);

            if (invoice is not null)
            {
                await _subscriptionWebhookProcessor.HandleInvoicePaymentFailedAsync(
                    invoice,
                    rawBody,
                    cancellationToken);
            }

            return true;
        }

        return false;
    }
    private async Task HandleWalletPaymentIntentEventAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        PaymentIntent? intent = TryGetPaymentIntentFromEvent(stripeEvent);

        if (intent?.Metadata is null)
            return;

        if (!intent.Metadata.TryGetValue("purpose", out string? purpose)
            || !string.Equals(purpose, "llm_wallet_refill", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        intent.Metadata.TryGetValue("tenant_id", out string? tenantIdRaw);
        intent.Metadata.TryGetValue("correlation_id", out string? correlationRaw);

        if (string.IsNullOrWhiteSpace(tenantIdRaw)
            || !Guid.TryParse(tenantIdRaw.Trim(), out Guid tenantId)
            || tenantId == Guid.Empty)
        {
            throw new InvalidOperationException(
                $"Stripe wallet webhook '{stripeEvent.Id}' is missing or has an invalid tenant_id metadata value.");
        }

        Guid correlationId = Guid.TryParse(correlationRaw, out Guid parsedCorrelation) ? parsedCorrelation : Guid.NewGuid();

        if (!await _walletRepository.TryInsertStripeWebhookIdempotencyAsync(stripeEvent.Id, stripeEvent.Type, cancellationToken)
                .ConfigureAwait(false))
        {
            return;
        }

        await _walletWebhookProcessor
            .ProcessPaymentIntentEventAsync(
                stripeEvent.Type,
                intent.Id,
                tenantIdRaw,
                intent.Amount,
                intent.LastPaymentError?.DeclineCode,
                correlationId,
                cancellationToken)
            .ConfigureAwait(false);
    }
    private static Session? TryGetCheckoutSessionFromEvent(Event stripeEvent)
    {
        if (stripeEvent.Data?.Object is Session fromTyped)
            return fromTyped;

        // StripeObjectConverter yields null on data.object when JSON omits the Stripe "object" discriminator.
        // EventConverter still stores data.object on RawObject; deserialize as Session so metadata activation works.
        if (stripeEvent.Data?.RawObject is JToken token)
            return token.ToObject<Session>(Newtonsoft.Json.JsonSerializer.Create(StripeConfiguration.SerializerSettings));

        return null;
    }
    private static PaymentIntent? TryGetPaymentIntentFromEvent(Event stripeEvent)
    {
        if (stripeEvent.Data?.Object is PaymentIntent fromTyped)
            return fromTyped;

        if (stripeEvent.Data?.RawObject is JToken token)
            return token.ToObject<PaymentIntent>(Newtonsoft.Json.JsonSerializer.Create(StripeConfiguration.SerializerSettings));

        return null;
    }
    private static Subscription? TryGetSubscriptionFromEvent(Event stripeEvent)
    {
        if (stripeEvent.Data?.Object is Subscription fromTyped)
            return fromTyped;

        if (stripeEvent.Data?.RawObject is JToken token)
            return token.ToObject<Subscription>(Newtonsoft.Json.JsonSerializer.Create(StripeConfiguration.SerializerSettings));

        return null;
    }
    private static Invoice? TryGetInvoiceFromEvent(Event stripeEvent)
    {
        if (stripeEvent.Data?.Object is Invoice fromTyped)
            return fromTyped;

        if (stripeEvent.Data?.RawObject is JToken token)
            return token.ToObject<Invoice>(Newtonsoft.Json.JsonSerializer.Create(StripeConfiguration.SerializerSettings));

        return null;
    }
    private static bool IsStripeConnectivityEvent(string eventType)
    {
        return string.Equals(eventType, "ping", StringComparison.OrdinalIgnoreCase);
    }
    private static string? ResolveWebhookSigningSecret(BillingOptions billing, StripeBillingWebhookRoute route)
    {
        if (route == StripeBillingWebhookRoute.Wallet)
        {
            string? wallet = billing.Stripe.WalletWebhookSigningSecret?.Trim();

            if (!string.IsNullOrWhiteSpace(wallet))
                return wallet;
        }
        else
        {
            string? subscription = billing.Stripe.SubscriptionWebhookSigningSecret?.Trim();

            if (!string.IsNullOrWhiteSpace(subscription))
                return subscription;
        }

        return billing.Stripe.WebhookSigningSecret?.Trim();
    }
}
