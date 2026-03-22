using ArchiForge.Decisioning.Alerts.Simulation;

namespace ArchiForge.Decisioning.Alerts.Tuning;

public interface IAlertNoiseScorer
{
    NoiseScoreBreakdown Score(
        RuleSimulationResult simulationResult,
        int targetCreatedAlertCountMin,
        int targetCreatedAlertCountMax);
}
