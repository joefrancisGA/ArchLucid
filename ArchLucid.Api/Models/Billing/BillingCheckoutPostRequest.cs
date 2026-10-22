namespace ArchLucid.Api.Models.Billing;

/// <summary>Body for <c>POST /v1/tenant/billing/checkout</c>.</summary>
public sealed class BillingCheckoutPostRequest
{
    /// <summary>One of <c>Team</c>, <c>Pro</c>, or <c>Enterprise</c>.</summary>
    public string? TargetTier
    {
        get;
        init;
    }

    public int Seats
    {
        get;
        init;
    } = 1;

    public int Workspaces
    {
        get;
        init;
    } = 1;

    public string? BillingEmail
    {
        get;
        init;
    }

    public string? ReturnUrl
    {
        get;
        init;
    }

    public string? CancelUrl
    {
        get;
        init;
    }
}
