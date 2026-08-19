namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class RiskReductionEstimate
{
    /// <summary>Risk reduction level: Low, Moderate, or High.</summary>
    public string Level
    {
        get;
        set;
    } = null!;

    public string? ScenarioNotes
    {
        get;
        set;
    }
}
