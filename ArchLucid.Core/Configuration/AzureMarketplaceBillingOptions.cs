namespace ArchLucid.Core.Configuration;

public sealed class AzureMarketplaceBillingOptions
{
    /// <summary>Landing URL returned from checkout when Marketplace is the provider (buyer completes in Azure).</summary>
    public string? LandingPageUrl
    {
        get;
        init;
    }

    /// <summary>
    ///     Public HTTPS webhook URL registered in Partner Center for SaaS lifecycle events
    ///     (typically <c>POST /v1/billing/webhooks/marketplace</c> on the production API host).
    /// </summary>
    public string? WebhookUrl
    {
        get;
        init;
    }

    /// <summary>Optional tenant id claim name inside the marketplace JWT (defaults to standard SaaS claims).</summary>
    public string? TenantIdClaimType
    {
        get;
        init;
    }

    /// <summary>OIDC metadata URL used to validate webhook JWT signatures (Microsoft identity platform).</summary>
    public string? OpenIdMetadataAddress
    {
        get;
        init;
    }

    /// <summary>Expected JWT audiences (e.g. <c>https://marketplaceapi.microsoft.com</c>).</summary>
    public string[]? ValidAudiences
    {
        get;
        init;
    }

    /// <summary>When false, skips the outbound SaaS activate HTTP call (useful for integration tests).</summary>
    public bool FulfillmentApiEnabled
    {
        get;
        init;
    } = true;

    /// <summary>
    ///     Partner Center **offer** / product identifier for the transactable SaaS listing (not the Azure subscription id).
    ///     Required in Production when <see cref="GaEnabled" /> is true so operators cannot enable GA mutations without a
    ///     bound offer.
    /// </summary>
    public string? MarketplaceOfferId
    {
        get;
        init;
    }

    /// <summary>
    ///     When false, Marketplace <c>ChangePlan</c> / <c>ChangeQuantity</c> webhooks are acknowledged with HTTP 202 and
    ///     <c>AcknowledgedNoOp</c> in <c>BillingWebhookEvents</c> without calling <c>sp_Billing_ChangePlan</c> /
    ///     <c>sp_Billing_ChangeQuantity</c>. Enable in production after plan/quantity mapping is validated.
    /// </summary>
    public bool GaEnabled
    {
        get;
        init;
    }

    /// <summary>
    ///     Partner Center marketplace <c>planId</c> → persisted <c>TenantTier</c> storage code
    ///     (<c>Standard</c>, <c>Enterprise</c>). Keys are matched case-insensitively after trim. Unlisted plan ids never
    ///     infer Enterprise; they default to <c>Standard</c> with a warning and metric.
    /// </summary>
    public Dictionary<string, string>? PlanIdTierMap
    {
        get;
        set;
    }
}
