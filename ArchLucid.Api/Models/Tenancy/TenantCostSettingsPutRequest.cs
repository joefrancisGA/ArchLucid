namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Body for <c>PUT /v1/tenant/cost-settings</c>.</summary>
public sealed class TenantCostSettingsPutRequest
{
    public decimal ArchitectHourlyRateUsd
    {
        get;
        init;
    }

    public decimal AverageIncidentCostUsd
    {
        get;
        init;
    }

    /// <summary>Enterprise Agreement discount multiplier for Retail API cost findings (default 1.0).</summary>
    public decimal? EaDiscountMultiplier
    {
        get;
        init;
    }

    /// <summary>
    ///     Optional EA discount percentage off Azure Retail (0–100). When set, takes precedence over
    ///     <see cref="EaDiscountMultiplier" />.
    /// </summary>
    public decimal? EaDiscountPercentage
    {
        get;
        init;
    }
}
