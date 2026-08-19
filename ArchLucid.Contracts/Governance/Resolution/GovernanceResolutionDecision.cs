namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>Explainability record for which policy pack version won for a logical governance item.</summary>
public class GovernanceResolutionDecision
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

    public Guid WinningPolicyPackId
    {
        get;
        set;
    }

    public string WinningPolicyPackName
    {
        get;
        set;
    } = null!;

    public string WinningVersion
    {
        get;
        set;
    } = null!;

    public string WinningScopeLevel
    {
        get;
        set;
    } = null!;

    public string ResolutionReason
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
