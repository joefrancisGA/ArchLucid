namespace ArchLucid.Contracts.Governance.Posture;

/// <summary>
///     Severity counts for review-integrity findings (second axis), excluded from pillar tiles (TB-2375).
/// </summary>
public sealed class ReviewIntegrityAggregate
{
    public int CriticalCount
    {
        get;
        init;
    }

    public int ErrorCount
    {
        get;
        init;
    }

    public int WarningCount
    {
        get;
        init;
    }

    public int InfoCount
    {
        get;
        init;
    }

    public int DispositionedCount
    {
        get;
        init;
    }

    public int MutedCount
    {
        get;
        init;
    }
}
