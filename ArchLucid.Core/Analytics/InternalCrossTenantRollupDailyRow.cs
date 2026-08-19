namespace ArchLucid.Core.Analytics;

/// <summary>
///     One tenant's BI-safe counters for a UTC calendar day. Persisted and exported with <see cref="AnalyticsTenantKey" />
///     only — no tenant slug, domain, or raw tenant id.
/// </summary>
public sealed class InternalCrossTenantRollupDailyRow
{
    public DateOnly RollupDate
    {
        get;
        init;
    }

    /// <summary>Lowercase hex HMAC-SHA256 surrogate (64 characters).</summary>
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

    /// <summary>Sum of LLM token counters for the rollup UTC day when the window table exists.</summary>
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
