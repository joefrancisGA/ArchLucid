using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Elapsed time and outcome counts for one backfill stage (TB-090).</summary>
[ExcludeFromCodeCoverage(Justification = "Backfill report DTO; no logic.")]
public sealed class SqlRelationalBackfillStageTiming
{
    public required string Stage
    {
        get;
        init;
    }

    public long ElapsedMilliseconds
    {
        get;
        init;
    }

    public int ProcessedCount
    {
        get;
        init;
    }

    public int SuccessCount
    {
        get;
        init;
    }

    public int FailureCount
    {
        get;
        init;
    }
}
