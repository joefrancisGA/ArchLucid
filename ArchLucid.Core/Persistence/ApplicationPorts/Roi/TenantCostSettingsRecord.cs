namespace ArchLucid.Persistence.Roi;

/// <summary>Row shape for <c>dbo.TenantCostSettings</c>.</summary>
public sealed class TenantCostSettingsRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

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

    /// <summary>Multiplier applied to Retail API cost findings (default 1.0 = no EA discount).</summary>
    public decimal EaDiscountMultiplier
    {
        get;
        init;
    } = 1.0m;

    public DateTimeOffset UpdatedUtc
    {
        get;
        init;
    }

    public string? UpdatedByActorId
    {
        get;
        init;
    }
}
