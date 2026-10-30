using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Agents;

/// <summary>
///     Operator-facing triage row for a real-agent failure scenario (no secrets or raw prompts).
/// </summary>
public sealed class RealAgentFailureTriageEntry
{
    public required string ScenarioId { get; init; }

    public required string Title { get; init; }

    private IReadOnlyList<string> failureClasses = [];

    /// <summary>Low-cardinality failure classes that map to this scenario (see <see cref="AgentExecutionFailureClasses" />).</summary>
    public required IReadOnlyList<string> FailureClasses
    {
        get => failureClasses;
        init => failureClasses = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> operatorNextSteps = [];

    public required IReadOnlyList<string> OperatorNextSteps
    {
        get => operatorNextSteps;
        init => operatorNextSteps = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<string> relatedDocPaths = [];

    public required IReadOnlyList<string> RelatedDocPaths
    {
        get => relatedDocPaths;
        init => relatedDocPaths = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
