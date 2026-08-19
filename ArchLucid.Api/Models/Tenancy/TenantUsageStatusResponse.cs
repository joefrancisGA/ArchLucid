namespace ArchLucid.Api.Models.Tenancy;

/// <summary>JSON for <c>GET /v1/tenant/usage-status</c> (Improvement #5).</summary>
public sealed class TenantUsageStatusResponse
{
    /// <summary>True when the tenant is on an active self-service trial (trial nudge owns that funnel).</summary>
    public bool IsTrial
    {
        get;
        init;
    }

    /// <summary>Marketplace tier label: Team, Professional, or Enterprise; null for active trials.</summary>
    public string? CommercialTier
    {
        get;
        init;
    }

    public int SeatsUsed
    {
        get;
        init;
    }

    /// <summary>Included seat cap for the commercial tier; null when unlimited (Enterprise without cap).</summary>
    public int? SeatsLimit
    {
        get;
        init;
    }

    public int WorkspacesUsed
    {
        get;
        init;
    }

    /// <summary>Included workspace cap; null when unlimited.</summary>
    public int? WorkspacesLimit
    {
        get;
        init;
    }
}
