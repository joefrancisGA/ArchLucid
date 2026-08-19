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
}
