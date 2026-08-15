namespace ArchLucid.Contracts.Governance;

/// <summary>Open assigned-to-me findings count for operator home badges (TB-057).</summary>
public sealed class GovernanceAssignedToMeFindingsCountResponse
{
    public int Count
    {
        get;
        init;
    }
}
