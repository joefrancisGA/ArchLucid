using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Coordination.Backfill;

[ExcludeFromCodeCoverage(Justification = "Backfill report DTO; no logic.")]
public sealed class SqlRelationalBackfillReport
{
    public int ProcessedCount
    {
        get;
        set;
    }

    public int SuccessCount
    {
        get;
        set;
    }

    public int FailureCount
    {
        get;
        set;
    }

    /// <summary>Entities skipped because <see cref="SqlRelationalBackfillOptions.MaxRetries"/> was exceeded (TB-086).</summary>
    public int SkippedQuarantinedCount
    {
        get;
        set;
    }

    public List<SqlRelationalBackfillFailure> Failures
    {
        get;
    } = [];

    /// <summary>Per-stage elapsed time and delta counts (TB-090).</summary>
    public List<SqlRelationalBackfillStageTiming> StageTimings
    {
        get;
    } = [];
}

[ExcludeFromCodeCoverage(Justification = "Backfill failure row DTO; no logic.")]
public sealed class SqlRelationalBackfillFailure
{
    public required string Stage
    {
        get;
        init;
    }

    public required string EntityKey
    {
        get;
        init;
    }

    public required string Message
    {
        get;
        init;
    }
}
