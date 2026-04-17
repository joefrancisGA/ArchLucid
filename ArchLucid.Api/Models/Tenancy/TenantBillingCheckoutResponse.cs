namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Placeholder response for <c>POST /v1/tenant/billing/checkout</c> until payment provider wiring (B2).</summary>
public sealed class TenantBillingCheckoutResponse
{
    /// <summary>Machine-readable lifecycle: <c>not_configured</c> until checkout is implemented.</summary>
    public string Status { get; init; } = "not_configured";
}
