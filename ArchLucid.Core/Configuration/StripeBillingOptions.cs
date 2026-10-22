namespace ArchLucid.Core.Configuration;

public sealed class StripeBillingOptions
{
    /// <summary>Stripe secret API key (Key Vault secret in production).</summary>
    public string? SecretKey
    {
        get;
        init;
    }

    /// <summary>
    ///     Optional restricted API key (<c>rk_</c>) used only for Checkout Session creation. Falls back to
    ///     <see cref="SecretKey" /> when unset.
    /// </summary>
    public string? CheckoutSecretKey
    {
        get;
        init;
    }

    /// <summary>Stripe webhook signing secret (whsec_…).</summary>
    public string? WebhookSigningSecret
    {
        get;
        init;
    }

    /// <summary>
    ///     Optional dedicated signing secret for <c>POST /v1/billing/webhooks/stripe/subscriptions</c>. Falls back to
    ///     <see cref="WebhookSigningSecret" /> when unset.
    /// </summary>
    public string? SubscriptionWebhookSigningSecret
    {
        get;
        init;
    }

    /// <summary>
    ///     Optional dedicated signing secret for wallet <c>payment_intent.*</c> events on
    ///     <c>POST /v1/billing/webhooks/stripe</c>. Falls back to <see cref="WebhookSigningSecret" /> when unset.
    /// </summary>
    public string? WalletWebhookSigningSecret
    {
        get;
        init;
    }

    /// <summary>Optional publishable key for client-side Stripe.js (not used server-side today).</summary>
    public string? PublishableKey
    {
        get;
        init;
    }

    public string? PriceIdTeam
    {
        get;
        init;
    }

    public string? PriceIdArchitect
    {
        get;
        init;
    }

    public string? PriceIdPro
    {
        get;
        init;
    }

    public string? PriceIdEnterprise
    {
        get;
        init;
    }
}
