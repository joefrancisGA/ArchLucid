using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Alerts.Tuning;

/// <summary>Output of threshold recommendation with ranked candidates.</summary>
public class ThresholdRecommendationResult
{
    public DateTime EvaluatedUtc
    {
        get;
        set;
    }

    public string RuleKind
    {
        get;
        set;
    } = null!;

    public string TunedMetricType
    {
        get;
        set;
    } = null!;

    public ThresholdCandidateEvaluation? RecommendedCandidate
    {
        get;
        set;
    }

    private List<string> summaryNotes = [];

    public List<string> SummaryNotes
    {
        get => summaryNotes;
        set => summaryNotes = ContractCollectionDefaults.Coalesce(value);
    }

    private List<ThresholdCandidateEvaluation> candidates = [];

    public List<ThresholdCandidateEvaluation> Candidates
    {
        get => candidates;
        set => candidates = ContractCollectionDefaults.Coalesce(value);
    }
}
