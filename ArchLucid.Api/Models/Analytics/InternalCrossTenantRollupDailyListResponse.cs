namespace ArchLucid.Api.Models.Analytics;

/// <summary>Daily pseudonymized cross-tenant rollup rows for operators.</summary>
public sealed class InternalCrossTenantRollupDailyListResponse
{
    public DateOnly RollupDate
    {
        get;
        init;
    }

    public IReadOnlyList<InternalCrossTenantRollupDailyItemResponse> Rows
    {
        get;
        init;
    } = [];
}
