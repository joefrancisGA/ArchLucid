namespace ArchLucid.Api.Models.E2e;

/// <summary>Body for <c>POST /v1/e2e/tenant/grant-enterprise-commercial</c> (live CI only).</summary>
public sealed class E2eHarnessTenantCommercialPostRequest
{
    public Guid TenantId
    {
        get;
        set;
    }
}
