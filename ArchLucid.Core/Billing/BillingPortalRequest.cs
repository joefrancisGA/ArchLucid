namespace ArchLucid.Core.Billing;

/// <summary>Input for <see cref="IBillingProvider.CreateBillingPortalSessionAsync" />.</summary>
public sealed class BillingPortalRequest
{
    public required Guid TenantId
    {
        get;
        init;
    }

    public required string ReturnUrl
    {
        get;
        init;
    }
}
