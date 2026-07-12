namespace ArchLucid.Core.Billing;

/// <summary>Hosted Stripe Billing Portal handoff.</summary>
public sealed class BillingPortalResult
{
    public required string PortalUrl
    {
        get;
        init;
    }

    public required string ProviderSessionId
    {
        get;
        init;
    }
}
