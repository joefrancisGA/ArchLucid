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
}
