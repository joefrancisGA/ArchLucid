using ArchiForge.Decisioning.Alerts.Simulation;

namespace ArchiForge.Decisioning.Alerts.Tuning;

public class ThresholdCandidateEvaluation
{
    public ThresholdCandidate Candidate { get; set; } = default!;
    public RuleSimulationResult SimulationResult { get; set; } = default!;
    public NoiseScoreBreakdown ScoreBreakdown { get; set; } = default!;
}
