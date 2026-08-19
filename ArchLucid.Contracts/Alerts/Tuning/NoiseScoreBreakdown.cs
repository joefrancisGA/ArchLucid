namespace ArchLucid.Contracts.Alerts.Tuning;

/// <summary>Decomposed heuristic score from alert noise scoring (higher <see cref="FinalScore" /> is better).</summary>
public class NoiseScoreBreakdown
{
    public double CoverageScore
    {
        get;
        set;
    }

    public double NoisePenalty
    {
        get;
        set;
    }

    public double SuppressionPenalty
    {
        get;
        set;
    }

    public double DensityPenalty
    {
        get;
        set;
    }

    public double FinalScore
    {
        get;
        set;
    }

    public List<string> Notes
    {
        get;
        set;
    } = [];
}
