using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Dry-run rebuild result — never persisted or activated.</summary>
public sealed class RecommendationLearningPreviewResponse
{
    public RecommendationLearningProfile ProposedProfile
    {
        get;
        set;
    } = new();

    private IReadOnlyList<RecommendationLearningWeightDelta> weightDeltas = [];

    public IReadOnlyList<RecommendationLearningWeightDelta> WeightDeltas
    {
        get => weightDeltas;
        set => weightDeltas = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<RecommendationLearningValidationCheck> validationChecks = [];

    public IReadOnlyList<RecommendationLearningValidationCheck> ValidationChecks
    {
        get => validationChecks;
        set => validationChecks = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

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
