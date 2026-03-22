namespace ArchiForge.Decisioning.Alerts.Tuning;

public class NoiseScoreBreakdown
{
    public double CoverageScore { get; set; }
    public double NoisePenalty { get; set; }
    public double SuppressionPenalty { get; set; }
    public double DensityPenalty { get; set; }

    public double FinalScore { get; set; }

    public List<string> Notes { get; set; } = [];
}
