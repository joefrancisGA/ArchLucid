namespace ArchLucid.Contracts.Evolution;

/// <summary>One shadow evaluation pass for a baseline architecture run (simulation-only row).</summary>
public sealed class EvolutionSimulationRunRecord
{
    public Guid SimulationRunId
    {
        get;
        init;
    }

    public Guid CandidateChangeSetId
    {
        get;
        init;
    }

    public string BaselineArchitectureRunId
    {
        get;
        init;
    } = string.Empty;

    public string EvaluationMode
    {
        get;
        init;
    } = EvolutionEvaluationModeValues.ReadOnlyArchitectureAnalysis;

    public string OutcomeJson
    {
        get;
        init;
    } = string.Empty;

    public string? WarningsJson
    {
        get;
        init;
    }

    public DateTime CompletedUtc
    {
        get;
        // SQL Server DATETIME2 preserves the UTC clock value, but not DateTime.Kind.
        init => field = value.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(value, DateTimeKind.Utc)
            : value;
    }

    public bool IsShadowOnly
    {
        get;
        init;
    } = true;
}
