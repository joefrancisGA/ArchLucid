namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>One policy pack assignment row captured on committed review packages.</summary>
public sealed class CommittedGovernancePackAssignmentSnapshot
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string PolicyPackVersion
    {
        get;
        set;
    } = null!;

    public string ScopeLevel
    {
        get;
        set;
    } = GovernanceScopeLevel.Project;

    /// <summary>
    ///     Persisted outcome after findings are available:
    ///     <see cref="PolicyPackEvaluationOutcomes" />.
    /// </summary>
    public string? EvaluationOutcome
    {
        get;
        set;
    }

    /// <summary>Compliance rule keys from the assigned pack version used for evaluation matching.</summary>
    public List<string> ComplianceRuleKeys
    {
        get;
        set;
    } = [];
}
