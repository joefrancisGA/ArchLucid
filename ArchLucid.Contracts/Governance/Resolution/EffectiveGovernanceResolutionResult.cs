using ArchLucid.Contracts.Governance;

namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>Complete output of effective governance resolution for a scope.</summary>
public class EffectiveGovernanceResolutionResult
{
    public Guid TenantId
    {
        get;
        set;
    }

    public Guid WorkspaceId
    {
        get;
        set;
    }

    public Guid ProjectId
    {
        get;
        set;
    }

    public PolicyPackContentDocument EffectiveContent
    {
        get;
        set;
    } = new();

    public List<GovernanceResolutionDecision> Decisions
    {
        get;
        set;
    } = [];

    public List<GovernanceConflictRecord> Conflicts
    {
        get;
        set;
    } = [];

    public List<string> Notes
    {
        get;
        set;
    } = [];
}
