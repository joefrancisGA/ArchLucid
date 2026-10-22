namespace ArchLucid.Api.Models.Billing;

/// <summary>Response for <c>GET /v1/tenant/billing/subscription</c>.</summary>
public sealed class BillingSubscriptionStatusResponseDto
{
    public bool HasSubscription
    {
        get;
        init;
    }

    public string? Provider
    {
        get;
        init;
    }

    public string? TierCode
    {
        get;
        init;
    }

    public string? Status
    {
        get;
        init;
    }

    public bool IsPaymentPastDue
    {
        get;
        init;
    }
}
