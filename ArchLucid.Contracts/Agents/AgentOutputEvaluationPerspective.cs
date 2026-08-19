namespace ArchLucid.Contracts.Agents;

/// <summary>One authority view of run agent-evaluation (recorded or advisory current — TB-973).</summary>
public sealed class AgentOutputEvaluationPerspective
{
    /// <summary><c>recorded</c> or <c>advisoryCurrent</c>.</summary>
    public required string Authority
    {
        get;
        init;
    }

    public QualityGateDefinitionSnapshotDto? GateDefinition
    {
        get;
        init;
    }

    public IReadOnlyList<AgentOutputEvaluationScore> Scores
    {
        get;
        init;
    } = [];

    public int TracesSkippedCount
    {
        get;
        init;
    }

    public double? AverageStructuralCompletenessRatio
    {
        get;
        init;
    }

    public double? AverageSemanticScore
    {
        get;
        init;
    }

    public AgentOutputQualityGateOutcome? AggregateQualityGateOutcome
    {
        get;
        init;
    }
}
