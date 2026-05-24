using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Startup.Validation.Rules;

/// <summary>
/// Production-only billing / Marketplace guards (Stripe live + Marketplace landing + GA offer binding).
/// Lives in <c>ArchLucid.Host.Core</c> with <see cref="ProductionSafetyRules"/> — not Host.Composition — so
/// <see cref="ArchLucidConfigurationRules"/> can call it without a circular project reference.
/// </summary>
internal static class BillingProductionSafetyRules
{
    /// <summary>Prefix on validation messages so startup can emit Critical logs for billing-only failures.</summary>
    public const string ErrorPrefix = "[BillingProductionSafety] ";

    private const string RemediationHint =
        "Fix Billing:Stripe:* and Billing:AzureMarketplace:* settings per docs/runbooks/PRODUCTION_DEPLOYMENT.md, then restart the host.";

    /// <summary>Stripe <c>sk_test_*</c> must not be configured in Production (charges and webhooks use test mode).</summary>
    public static void CollectStripeTestKeyDisallowedInProduction(IConfiguration configuration, List<string> errors)
    {
        BillingOptions billing =
            configuration.GetSection(BillingOptions.SectionName).Get<BillingOptions>() ?? new BillingOptions();

        string? secretKey = billing.Stripe.SecretKey?.Trim();

        if (string.IsNullOrWhiteSpace(secretKey))
            return;

        if (!secretKey.StartsWith("sk_test_", StringComparison.Ordinal))
            return;

        errors.Add(BillingError(
            "Billing:Stripe:SecretKey uses Stripe test prefix sk_test_; configure a live sk_live_ key in Production."));
    }

    /// <summary>Stripe <c>sk_live_*</c> without a webhook signing secret is unsafe in Production (unsigned events).</summary>
    public static void CollectStripeLiveKeyRequiresWebhookSigningSecret(IConfiguration configuration, List<string> errors)
    {
        BillingOptions billing =
            configuration.GetSection(BillingOptions.SectionName).Get<BillingOptions>() ?? new BillingOptions();

        string? secretKey = billing.Stripe.SecretKey?.Trim();

        if (string.IsNullOrWhiteSpace(secretKey))
            return;

        if (!secretKey.StartsWith("sk_live_", StringComparison.Ordinal))
            return;

        if (!string.IsNullOrWhiteSpace(billing.Stripe.WebhookSigningSecret?.Trim()))
            return;

        errors.Add(BillingError(
            "Billing:Stripe:SecretKey uses live Stripe prefix sk_live_; configure Billing:Stripe:WebhookSigningSecret in Production so webhook signatures can be verified."));
    }

    /// <summary>Azure Marketplace checkout requires a public HTTPS landing URL (no loopback hosts).</summary>
    public static void CollectAzureMarketplaceLandingPageUrl(IConfiguration configuration, List<string> errors)
    {
        BillingOptions billing =
            configuration.GetSection(BillingOptions.SectionName).Get<BillingOptions>() ?? new BillingOptions();

        if (!string.Equals(billing.Provider.Trim(), BillingProviderNames.AzureMarketplace, StringComparison.OrdinalIgnoreCase))
            return;

        CollectAzureMarketplacePublicHttpsUrl(
            billing.AzureMarketplace.LandingPageUrl,
            "Billing:AzureMarketplace:LandingPageUrl",
            "Partner Center landing page",
            errors);
    }

    /// <summary>Azure Marketplace webhooks require a public HTTPS callback URL (no loopback or ngrok tunnel hosts).</summary>
    public static void CollectAzureMarketplaceWebhookUrl(IConfiguration configuration, List<string> errors)
    {
        BillingOptions billing =
            configuration.GetSection(BillingOptions.SectionName).Get<BillingOptions>() ?? new BillingOptions();

        if (!string.Equals(billing.Provider.Trim(), BillingProviderNames.AzureMarketplace, StringComparison.OrdinalIgnoreCase))
            return;

        CollectAzureMarketplacePublicHttpsUrl(
            billing.AzureMarketplace.WebhookUrl,
            "Billing:AzureMarketplace:WebhookUrl",
            "Partner Center webhook callback",
            errors);
    }

    /// <summary>GA Marketplace mutations require a configured Partner Center offer id.</summary>
    public static void CollectAzureMarketplaceGaRequiresOfferId(IConfiguration configuration, List<string> errors)
    {
        BillingOptions billing =
            configuration.GetSection(BillingOptions.SectionName).Get<BillingOptions>() ?? new BillingOptions();

        if (!string.Equals(billing.Provider.Trim(), BillingProviderNames.AzureMarketplace, StringComparison.OrdinalIgnoreCase))
            return;

        if (!billing.AzureMarketplace.GaEnabled)
            return;

        if (!string.IsNullOrWhiteSpace(billing.AzureMarketplace.MarketplaceOfferId?.Trim()))
            return;

        errors.Add(BillingError(
            "Billing:AzureMarketplace:GaEnabled=true requires Billing:AzureMarketplace:MarketplaceOfferId (Partner Center transactable offer / product id) in Production."));
    }

    public static bool IsBillingSafetyError(string error)
    {
        ArgumentNullException.ThrowIfNull(error);

        return error.StartsWith(ErrorPrefix, StringComparison.Ordinal);
    }

    public static void LogCriticalForMatchingErrors(IReadOnlyList<string> errors, ILogger logger)
    {
        ArgumentNullException.ThrowIfNull(errors);
        ArgumentNullException.ThrowIfNull(logger);

        foreach (string error in errors)
        {
            if (!IsBillingSafetyError(error))
                continue;

            if (logger.IsEnabled(LogLevel.Critical))
                logger.LogCritical(
                    "Billing production safety validation failed. {Remediation} Details: {Error}",
                    RemediationHint,
                    error);
        }
    }

    private static string BillingError(string message) => ErrorPrefix + message;

    private static void CollectAzureMarketplacePublicHttpsUrl(
        string? configuredUrl,
        string configurationKey,
        string partnerCenterPurpose,
        List<string> errors)
    {
        string? trimmed = configuredUrl?.Trim();

        if (string.IsNullOrWhiteSpace(trimmed))
        {
            errors.Add(BillingError(
                "Billing:Provider is AzureMarketplace; configure "
                + configurationKey
                + " with an absolute HTTPS URL ("
                + partnerCenterPurpose
                + ")."));

            return;
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out Uri? uri))
        {
            errors.Add(BillingError(configurationKey + " must be an absolute URI in Production."));

            return;
        }

        if (uri.Scheme != Uri.UriSchemeHttps)
        {
            errors.Add(BillingError(configurationKey + " must use https in Production."));

            return;
        }

        if (IsDisallowedMarketplaceCallbackHost(uri.Host))
            errors.Add(BillingError(
                configurationKey
                + " must not use a localhost, loopback, or ngrok tunnel host in Production (Partner Center cannot reach it)."));
    }

    private static bool IsDisallowedMarketplaceCallbackHost(string host)
    {
        if (IsLocalOrLoopbackHost(host))
            return true;

        return host.EndsWith(".ngrok.io", StringComparison.OrdinalIgnoreCase)
            || host.EndsWith(".ngrok-free.app", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLocalOrLoopbackHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
            return true;

        if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        if (host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase))
            return true;

        return host is "127.0.0.1" or "::1" || host.StartsWith("127.", StringComparison.Ordinal);
    }
}
