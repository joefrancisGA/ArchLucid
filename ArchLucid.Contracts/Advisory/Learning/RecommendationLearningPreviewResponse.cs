namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Dry-run rebuild result — never persisted or activated.</summary>
public sealed class RecommendationLearningPreviewResponse
{
    public RecommendationLearningProfile ProposedProfile
    {
        get;
        set;
    } = new();

    public IReadOnlyList<RecommendationLearningWeightDelta> WeightDeltas
    {
        get;
        set;
    } = [];

    public IReadOnlyList<RecommendationLearningValidationCheck> ValidationChecks
    {
        get;
        set;
    } = [];

    public int SourceRecordCount
    {
        get;
        set;
    }

    public int EligibleRecordCount
    {
        get;
        set;
    }

    public DateTime? SourceDataStartUtc
    {
        get;
        set;
    }

    public DateTime? SourceDataEndUtc
    {
        get;
        set;
    }

    public long BuildDurationMs
    {
        get;
        set;
    }

    public string CorrelationId
    {
        get;
        set;
    } = string.Empty;
}
