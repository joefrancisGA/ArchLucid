namespace ArchLucid.Core.Analytics;

/// <summary>
///     In-process per-tenant run metrics while building rollups. Must not be written to rollup tables or API payloads.
/// </summary>
public sealed class InternalCrossTenantTenantRunMetrics
{
    public Guid TenantId
    {
        get;
        init;
    }

    public long TotalRunsNonArchived
    {
        get;
        init;
    }

    public long TotalCompletedRuns
    {
        get;
        init;
    }

    public double SumCompletionSeconds
    {
        get;
        init;
    }

    public decimal EstimatedEngineeringHoursSaved
    {
        get;
        init;
    }

    public long? LlmTokensUsed
    {
        get;
        init;
    }
}
