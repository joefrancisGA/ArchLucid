namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Counts of recommendation outcomes included in or excluded from learning rebuilds.</summary>
public sealed class RecommendationLearningOutcomeEligibilityBreakdown
{
    public int Accepted
    {
        get;
        set;
    }

    public int Rejected
    {
        get;
        set;
    }

    public int Deferred
    {
        get;
        set;
    }

    public int Implemented
    {
        get;
        set;
    }

    public int ProposedExcluded
    {
        get;
        set;
    }

    public int TruncatedByBatchCap
    {
        get;
        set;
    }
}
