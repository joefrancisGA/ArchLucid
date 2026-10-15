using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Evolution;

/// <summary>
///     60R candidate change set: a reviewable package derived from a 59R improvement plan (simulation-only until
///     explicitly approved).
/// </summary>
public sealed class CandidateChangeSet
{
    public Guid ChangeSetId
    {
        get;
        init;
    }

    public Guid SourcePlanId
    {
        get;
        init;
    }

    public string Description
    {
        get;
        init;
    } = string.Empty;

    private IReadOnlyList<CandidateChangeSetStep> proposedActions = [];

    public IReadOnlyList<CandidateChangeSetStep> ProposedActions
    {
        get => proposedActions;
        init => proposedActions = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<ChangeSetAffectedComponent> affectedComponents = [];

    public IReadOnlyList<ChangeSetAffectedComponent> AffectedComponents
    {
        get => affectedComponents;
        init => affectedComponents = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private ExpectedImpact expectedImpact = new();

    public ExpectedImpact ExpectedImpact
    {
        get => expectedImpact;
        init => expectedImpact = value ?? new();
    }

    public double? SimulationScore
    {
        get;
        init;
    }

    public double? DeterminismScore
    {
        get;
        init;
    }

    public double? RegressionRiskScore
    {
        get;
        init;
    }

    public ApprovalStatus ApprovalStatus
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
