namespace ArchLucid.Application.WeeklyArchitectureDigest;

/// <summary>Mock weekly digest envelope reserved for eventual email/HTML delivery adapters.</summary>
public sealed class WeeklyArchitectureDigestLogPayload
{
    public required DateTime DigestGeneratedUtc
    {
        get;
        init;
    }

    /// <summary>Lower-bound timestamp for <see cref="SummarizedCriticalFindings"/> (inclusive).</summary>
    public required DateTime IncludedSinceUtc
    {
        get;
        init;
    }

    public required string CriticalSeverityKeyword
    {
        get;
        init;
    }

    public long ApproximateCriticalFindingCountLastWindow
    {
        get;
        init;
    }

    public required IReadOnlyList<WeeklyArchitectureDigestCriticalFindingSummaryLine> SummarizedCriticalFindings
    {
        get;
        init;
    }
}
