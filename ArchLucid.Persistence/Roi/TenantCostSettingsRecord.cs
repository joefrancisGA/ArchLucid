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
