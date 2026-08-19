using ArchLucid.Contracts.Alerts.Simulation;

namespace ArchLucid.Contracts.Alerts.Tuning;

/// <summary>One row in <see cref="ThresholdRecommendationResult.Candidates" />.</summary>
public class ThresholdCandidateEvaluation
{
    public ThresholdCandidate Candidate
    {
        get;
        set;
    } = null!;

    public RuleSimulationResult SimulationResult
    {
        get;
        set;
    } = null!;

    public NoiseScoreBreakdown ScoreBreakdown
    {
        get;
        set;
    } = null!;
}
