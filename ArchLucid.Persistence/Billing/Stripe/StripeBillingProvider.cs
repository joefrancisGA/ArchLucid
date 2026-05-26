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
    BillingWebhookTrialActivator trialActivator,
    IMarketplaceChangePlanWebhookMutationHandler changePlanWebhookMutationHandler,
    ILlmTenantWalletStripeWebhookProcessor walletWebhookProcessor,
    ILlmTenantWalletRepository walletRepository) : IBillingProvider
{
    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly IMarketplaceChangePlanWebhookMutationHandler _changePlanWebhookMutationHandler =
        changePlanWebhookMutationHandler ?? throw new ArgumentNullException(nameof(changePlanWebhookMutationHandler));

    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    private readonly IBillingWebhookReplayGuard _webhookReplayGuard =
        webhookReplayGuard ?? throw new ArgumentNullException(nameof(webhookReplayGuard));

    private readonly BillingWebhookTrialActivator _trialActivator =
        trialActivator ?? throw new ArgumentNullException(nameof(trialActivator));

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
        string? secretKey = billing.Stripe.SecretKey?.Trim();

        if (string.IsNullOrWhiteSpace(secretKey))
            throw new InvalidOperationException("Billing:Stripe:SecretKey is not configured.");

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

    public async Task<BillingWebhookHandleResult> HandleWebhookAsync(
        BillingWebhookInbound inbound,
        CancellationToken cancellationToken)
    {
        BillingOptions billing = _billingOptions.CurrentValue;
        string? signingSecret = billing.Stripe.WebhookSigningSecret?.Trim();

        if (string.IsNullOrWhiteSpace(signingSecret) || string.IsNullOrWhiteSpace(inbound.StripeSignatureHeader))

            return BillingWebhookHandleResult.Rejected(
                "Stripe webhook signing secret or Stripe-Signature header is missing.");

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

            if (string.Equals(prior, "Processed", StringComparison.OrdinalIgnoreCase))
                return BillingWebhookHandleResult.ReplayRejected(
                    $"Stripe webhook event '{stripeEvent.Id}' was already processed.");
        }

        try
        {
            if (string.Equals(stripeEvent.Type, "checkout.session.completed", StringComparison.OrdinalIgnoreCase))
            {
                Session? session = TryGetCheckoutSessionFromEvent(stripeEvent);

                if (session is not null)
                    await HandleCheckoutSessionCompletedAsync(session, inbound.RawBody, cancellationToken);
            }
            else if (stripeEvent.Type.StartsWith("payment_intent.", StringComparison.OrdinalIgnoreCase))
            {
                await HandleWalletPaymentIntentEventAsync(stripeEvent, cancellationToken).ConfigureAwait(false);
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

    private async Task HandleCheckoutSessionCompletedAsync(
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
            ProviderName,
            subscriptionId,
            tierCode,
            BillingTierCode.CheckoutTierLabel(checkoutTier),
            seats,
            workspaces,
            rawBody,
            cancellationToken);
    }

    private static bool TryParseGuid(Dictionary<string, string> metadata, string key, out Guid value)
    {
        value = Guid.Empty;

        if (!metadata.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return false;

        return Guid.TryParse(raw.Trim(), out value);
    }

    private static BillingCheckoutTier ParseCheckoutTier(Dictionary<string, string> metadata, string key)
    {
        if (!metadata.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return BillingCheckoutTier.Team;

        return raw.Trim() switch
        {
            "Pro" => BillingCheckoutTier.Pro,
            "Enterprise" => BillingCheckoutTier.Enterprise,
            _ => BillingCheckoutTier.Team
        };
    }

    private static int ParsePositiveInt(Dictionary<string, string> metadata, string key, int fallback)
    {
        if (!metadata.TryGetValue(key, out string? raw) || string.IsNullOrWhiteSpace(raw))
            return fallback;

        return int.TryParse(raw.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int n) && n > 0
            ? n
            : fallback;
    }

    private static string? ResolvePriceId(BillingOptions billing, BillingCheckoutTier tier)
    {
        return tier switch
        {
            BillingCheckoutTier.Team => billing.Stripe.PriceIdTeam?.Trim(),
            BillingCheckoutTier.Pro => billing.Stripe.PriceIdPro?.Trim(),
            BillingCheckoutTier.Enterprise => billing.Stripe.PriceIdEnterprise?.Trim(),
            _ => billing.Stripe.PriceIdTeam?.Trim()
        };
    }
}
