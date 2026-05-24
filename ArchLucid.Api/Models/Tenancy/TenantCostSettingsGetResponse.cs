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

    /// <summary>Enterprise Agreement discount multiplier applied to cost-category savings (default 1.0).</summary>
    public decimal EaDiscountMultiplier
    {
        get;
        init;
    } = 1.0m;

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
