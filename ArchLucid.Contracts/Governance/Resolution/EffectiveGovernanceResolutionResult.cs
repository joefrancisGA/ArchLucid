using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Serialization;

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

    private PolicyPackContentDocument effectiveContent = new();

    public PolicyPackContentDocument EffectiveContent
    {
        get => effectiveContent;
        set => effectiveContent = value ?? new PolicyPackContentDocument();
    }

    private List<GovernanceResolutionDecision> decisions = [];

    public List<GovernanceResolutionDecision> Decisions
    {
        get => decisions;
        set => decisions = ContractCollectionDefaults.Coalesce(value);
    }

    private List<GovernanceConflictRecord> conflicts = [];

    public List<GovernanceConflictRecord> Conflicts
    {
        get => conflicts;
        set => conflicts = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> notes = [];

    public List<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.Coalesce(value);
    }
}
