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

    public List<string> SummaryNotes
    {
        get;
        set;
    } = [];

    public List<ThresholdCandidateEvaluation> Candidates
    {
        get;
        set;
    } = [];
}
