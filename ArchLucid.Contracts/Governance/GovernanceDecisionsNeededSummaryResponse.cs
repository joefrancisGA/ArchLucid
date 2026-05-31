namespace ArchLucid.Contracts.Governance;

/// <summary>Operator dashboard counts for governance items requiring action (TB-062).</summary>
public sealed class GovernanceDecisionsNeededSummaryResponse
{
    public int PendingApprovals
    {
        get;
        set;
    }

    public int StaleRisks
    {
        get;
        set;
    }

    public int UnownedHighSeverityRisks
    {
        get;
        set;
    }

    public int FindingsAwaitingEvidence
    {
        get;
        set;
    }

    public int WaiversExpiringWithin14Days
    {
        get;
        set;
    }

    public int DeferredFindingsDue
    {
        get;
        set;
    }

    public int TotalDecisionItems
    {
        get;
        set;
    }
}
