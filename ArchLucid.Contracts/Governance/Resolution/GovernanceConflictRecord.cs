namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>Describes a governance conflict detected during merge.</summary>
public class GovernanceConflictRecord
{
    public string ItemType
    {
        get;
        set;
    } = null!;

    public string ItemKey
    {
        get;
        set;
    } = null!;

    public string ConflictType
    {
        get;
        set;
    } = null!;

    public string Description
    {
        get;
        set;
    } = null!;

    public List<GovernanceResolutionCandidate> Candidates
    {
        get;
        set;
    } = [];
}
