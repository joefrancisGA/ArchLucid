namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Body for <c>GET /v1/tenant/cost-settings</c>.</summary>
public sealed class TenantCostSettingsGetResponse
{
    /// <summary>Configured architect hourly rate, or platform default when no row exists.</summary>
    public decimal ArchitectHourlyRateUsd
    {
        get;
        init;
    }

    /// <summary>Configured average incident cost, or platform default when no row exists.</summary>
    public decimal AverageIncidentCostUsd
    {
        get;
        init;
    }

    /// <summary>When <see langword="true" />, values come from <c>dbo.TenantCostSettings</c>; otherwise ROI model defaults.</summary>
    public bool IsTenantConfigured
    {
        get;
        init;
    }

    public DateTimeOffset? UpdatedUtc
    {
        get;
        init;
    }
}
