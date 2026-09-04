namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/roi-loaded-hourly-cost</c>.</summary>
public sealed class SetRoiLoadedHourlyCostUsdRequest
{
    public decimal HourlyCostUsd
    {
        get;
        set;
    }
}
