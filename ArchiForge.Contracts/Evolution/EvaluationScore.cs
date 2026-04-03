namespace ArchiForge.Contracts.Evolution;

/// <summary>Normalized or domain-specific scores for a simulation or aggregate evaluation (scale defined by producer).</summary>
public sealed class EvaluationScore
{
    public double? SimulationScore { get; init; }

    public double? DeterminismScore { get; init; }

    public double? RegressionRiskScore { get; init; }
}
