namespace ArchLucid.Api.Models.Analytics;

/// <summary>One pseudonymized tenant row for a UTC rollup day.</summary>
public sealed class InternalCrossTenantRollupDailyItemResponse
{
    public DateOnly RollupDate
    {
        get;
        init;
    }

    public string AnalyticsTenantKey
    {
        get;
        init;
    } = string.Empty;

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

    public double? AverageCompletedRunDurationSeconds
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

    public DateTimeOffset ComputedUtc
    {
        get;
        init;
    }
}
