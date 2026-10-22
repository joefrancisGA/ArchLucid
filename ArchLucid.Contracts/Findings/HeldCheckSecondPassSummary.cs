namespace ArchLucid.Contracts.Findings;

/// <summary>Persisted second-pass delta on a findings snapshot for operator advisory copy (DX-60).</summary>
public sealed class HeldCheckSecondPassSummary
{
    public HeldCheckInputCode InputCode
    {
        get;
        set;
    }

    public HeldCheckSecondPassStatus Status
    {
        get;
        set;
    }

    public int UnblockedEngineCount
    {
        get;
        set;
    }

    public int NewDecisionGradeCount
    {
        get;
        set;
    }
}
