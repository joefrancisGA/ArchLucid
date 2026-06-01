namespace ArchLucid.Contracts.Governance;

/// <summary>Run-level operator governance disposition (TB-112).</summary>
public enum RunOperatorGovernanceDecision
{
    Approved = 0,
    Rejected = 1,
    RequestRemediation = 2,
}
