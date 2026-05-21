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
}
