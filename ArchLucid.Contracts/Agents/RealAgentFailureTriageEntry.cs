namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Operator-facing triage row for a real-agent failure scenario (no secrets or raw prompts).
/// </summary>
public sealed class RealAgentFailureTriageEntry
{
    public required string ScenarioId { get; init; }

    public required string Title { get; init; }

    /// <summary>Low-cardinality failure classes that map to this scenario (see <see cref="AgentExecutionFailureClasses" />).</summary>
    public required IReadOnlyList<string> FailureClasses { get; init; }

    public required IReadOnlyList<string> OperatorNextSteps { get; init; }

    public required IReadOnlyList<string> RelatedDocPaths { get; init; }
}
