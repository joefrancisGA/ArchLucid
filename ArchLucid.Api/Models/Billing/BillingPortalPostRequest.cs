namespace ArchLucid.Api.Models.Billing;

/// <summary>Body for <c>POST /v1/tenant/billing/portal</c>.</summary>
public sealed class BillingPortalPostRequest
{
    public string? ReturnUrl
    {
        get;
        init;
    }
}
