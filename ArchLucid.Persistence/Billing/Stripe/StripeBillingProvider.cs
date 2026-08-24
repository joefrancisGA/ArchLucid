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

public sealed class StripeBillingProvider(
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

    public async Task<BillingCheckoutResult> CreateCheckoutSessionAsync(
        BillingCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        BillingOptions billing = _billingOptions.CurrentValue;
        string? secretKey = ResolveCheckoutApiKey(billing);

        if (string.IsNullOrWhiteSpace(secretKey))
            throw new InvalidOperationException(
                "Billing:Stripe:CheckoutSecretKey or Billing:Stripe:SecretKey is not configured.");

        string? priceId = ResolvePriceId(billing, request.TargetTier);

        if (string.IsNullOrWhiteSpace(priceId))

            throw new InvalidOperationException(
                "Stripe price id is not configured for the requested tier (Billing:Stripe:PriceIdTeam/Pro/Enterprise).");

        SessionService sessionService = new();

        SessionCreateOptions options = new()
        {
            Mode = "subscription",
            SuccessUrl = request.ReturnUrl,
            CancelUrl = request.CancelUrl,
            ClientReferenceId = request.TenantId.ToString("D", CultureInfo.InvariantCulture),
            Metadata = new Dictionary<string, string>
            {
                ["tenant_id"] = request.TenantId.ToString("D", CultureInfo.InvariantCulture),
                ["workspace_id"] = request.WorkspaceId.ToString("D", CultureInfo.InvariantCulture),
                ["project_id"] = request.ProjectId.ToString("D", CultureInfo.InvariantCulture),
                ["tier"] = BillingTierCode.CheckoutTierLabel(request.TargetTier),
                ["seats"] = Math.Max(1, request.Seats).ToString(CultureInfo.InvariantCulture),
                ["workspaces"] = Math.Max(1, request.Workspaces).ToString(CultureInfo.InvariantCulture)
            },
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = new Dictionary<string, string>
                {
                    ["tenant_id"] = request.TenantId.ToString("D", CultureInfo.InvariantCulture),
                    ["workspace_id"] = request.WorkspaceId.ToString("D", CultureInfo.InvariantCulture),
                    ["project_id"] = request.ProjectId.ToString("D", CultureInfo.InvariantCulture),
                    ["tier"] = BillingTierCode.CheckoutTierLabel(request.TargetTier),
                    ["seats"] = Math.Max(1, request.Seats).ToString(CultureInfo.InvariantCulture),
                    ["workspaces"] = Math.Max(1, request.Workspaces).ToString(CultureInfo.InvariantCulture)
                }
            },
            LineItems =
            [
                new SessionLineItemOptions { Price = priceId, Quantity = 1 }
            ]
        };

        if (!string.IsNullOrWhiteSpace(request.BillingEmail))

            options.CustomerEmail = request.BillingEmail;

        RequestOptions requestOptions = new()
        {
            ApiKey = secretKey
        };

        Session session = await sessionService.CreateAsync(options, requestOptions, cancellationToken);

        string tierCode = BillingTierCode.FromCheckoutTier(request.TargetTier);

        await _ledger.UpsertPendingCheckoutAsync(
            request.TenantId,
            request.WorkspaceId,
            request.ProjectId,
            ProviderName,
            session.Id,
            tierCode,
            Math.Max(1, request.Seats),
            Math.Max(1, request.Workspaces),
            cancellationToken);

        // ReSharper disable once PatternAlwaysMatches
        DateTimeOffset? expiresUtc = session.ExpiresAt is DateTime dt
            ? new DateTimeOffset(DateTime.SpecifyKind(dt, DateTimeKind.Utc))
            : null;

        return new BillingCheckoutResult { CheckoutUrl = session.Url ?? string.Empty, ProviderSessionId = session.Id, ExpiresUtc = expiresUtc };
    }

    public async Task<BillingPortalResult> CreateBillingPortalSessionAsync(
        BillingPortalRequest request,
        CancellationToken cancellationToken)
    {
        BillingOptions billing = _billingOptions.CurrentValue;
        string? secretKey = ResolvePortalApiKey(billing);

        if (string.IsNullOrWhiteSpace(secretKey))
            throw new InvalidOperationException("Billing:Stripe:SecretKey is not configured.");

        string customerId = await ResolveStripeCustomerIdAsync(request.TenantId, secretKey, cancellationToken);

        global::Stripe.BillingPortal.SessionCreateOptions options = new()
        {
            Customer = customerId,
            ReturnUrl = request.ReturnUrl
        };

        RequestOptions requestOptions = new()
        {
            ApiKey = secretKey
        };

        global::Stripe.BillingPortal.SessionService portalService = new();
        global::Stripe.BillingPortal.Session portalSession = await portalService.CreateAsync(options, requestOptions, cancellationToken);

        return new BillingPortalResult
        {
            PortalUrl = portalSession.Url ?? string.Empty,
            ProviderSessionId = portalSession.Id
        };
    }

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

    private static string? ResolveCheckoutApiKey(BillingOptions billing)
    {
        string? restricted = billing.Stripe.CheckoutSecretKey?.Trim();

        if (!string.IsNullOrWhiteSpace(restricted))
            return restricted;

        return billing.Stripe.SecretKey?.Trim();
    }

    /// <summary>Portal session creation requires the standard secret key; restricted checkout keys may lack portal scope.</summary>
    private static string? ResolvePortalApiKey(BillingOptions billing) => billing.Stripe.SecretKey?.Trim();

    private static string? ResolvePriceId(BillingOptions billing, BillingCheckoutTier tier)
    {
        return tier switch
        {
            BillingCheckoutTier.Team => billing.Stripe.PriceIdTeam?.Trim(),
            BillingCheckoutTier.Architect => billing.Stripe.PriceIdArchitect?.Trim(),
            BillingCheckoutTier.Pro => billing.Stripe.PriceIdPro?.Trim(),
            BillingCheckoutTier.Enterprise => billing.Stripe.PriceIdEnterprise?.Trim(),
            _ => billing.Stripe.PriceIdTeam?.Trim()
        };
    }

    private async Task<string> ResolveStripeCustomerIdAsync(
        Guid tenantId,
        string secretKey,
        CancellationToken cancellationToken)
    {
        string? providerRef = await _ledger.TryGetProviderSubscriptionIdAsync(tenantId, cancellationToken);

        if (string.IsNullOrWhiteSpace(providerRef))
        {
            throw new InvalidOperationException(
                "No Stripe customer is linked to this tenant yet. Complete checkout first.");
        }

        string? fromProvider = await TryResolveCustomerFromProviderRefAsync(
            tenantId,
            providerRef.Trim(),
            secretKey,
            cancellationToken);

        if (string.IsNullOrWhiteSpace(fromProvider))
        {
            throw new InvalidOperationException(
                "No Stripe customer is linked to this tenant yet. Complete checkout first.");
        }

        return fromProvider;
    }

    private static async Task<string?> TryResolveCustomerFromProviderRefAsync(
        Guid tenantId,
        string providerRef,
        string secretKey,
        CancellationToken cancellationToken)
    {
        RequestOptions requestOptions = new()
        {
            ApiKey = secretKey
        };

        if (providerRef.StartsWith("sub_", StringComparison.Ordinal))
        {
            SubscriptionService subscriptionService = new();
            Subscription subscription = await subscriptionService.GetAsync(
                providerRef,
                requestOptions: requestOptions,
                cancellationToken: cancellationToken);

            if (!MetadataMatchesTenant(subscription.Metadata, tenantId))
            {
                throw new InvalidOperationException("Stripe subscription is not linked to this tenant.");
            }

            return subscription.CustomerId;
        }

        if (!providerRef.StartsWith("cs_", StringComparison.Ordinal))
            return null;

        SessionService sessionService = new();
        Session checkoutSession = await sessionService.GetAsync(
            providerRef,
            requestOptions: requestOptions,
            cancellationToken: cancellationToken);

        if (!MetadataMatchesTenant(checkoutSession.Metadata, tenantId))
        {
            throw new InvalidOperationException("Stripe checkout session is not linked to this tenant.");
        }

        if (!string.IsNullOrWhiteSpace(checkoutSession.CustomerId))
            return checkoutSession.CustomerId;

        if (string.IsNullOrWhiteSpace(checkoutSession.SubscriptionId))
            return null;

        SubscriptionService subscriptionServiceFromSession = new();
        Subscription subscriptionFromSession = await subscriptionServiceFromSession.GetAsync(
            checkoutSession.SubscriptionId,
            requestOptions: requestOptions,
            cancellationToken: cancellationToken);

        if (!MetadataMatchesTenant(subscriptionFromSession.Metadata, tenantId))
        {
            throw new InvalidOperationException("Stripe subscription is not linked to this tenant.");
        }

        return subscriptionFromSession.CustomerId;
    }

    private static bool MetadataMatchesTenant(IReadOnlyDictionary<string, string>? metadata, Guid tenantId)
    {
        if (metadata is null)
            return false;

        if (!metadata.TryGetValue("tenant_id", out string? raw) || string.IsNullOrWhiteSpace(raw))
            return false;

        return Guid.TryParse(raw.Trim(), out Guid parsedTenantId) && parsedTenantId == tenantId;
    }
}
