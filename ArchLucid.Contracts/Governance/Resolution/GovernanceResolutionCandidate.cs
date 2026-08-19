namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>One pack contribution to a single merge item.</summary>
public class GovernanceResolutionCandidate
{
    public Guid PolicyPackId
    {
        get;
        set;
    }

    public string PolicyPackName
    {
        get;
        set;
    } = null!;

    public string Version
    {
        get;
        set;
    } = null!;

    public string ScopeLevel
    {
        get;
        set;
    } = null!;

    public int PrecedenceRank
    {
        get;
        set;
    }

    public bool WasSelected
    {
        get;
        set;
    }

    public string ValueJson
    {
        get;
        set;
    } = null!;

    public Guid AssignmentId
    {
        get;
        set;
    }

    public DateTime AssignedUtc
    {
        get;
        set;
    }
}
