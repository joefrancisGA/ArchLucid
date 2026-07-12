namespace ArchLucid.Api.Models.Billing;

/// <summary>Response for <c>POST /v1/tenant/billing/portal</c>.</summary>
public sealed class BillingPortalResponseDto
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
