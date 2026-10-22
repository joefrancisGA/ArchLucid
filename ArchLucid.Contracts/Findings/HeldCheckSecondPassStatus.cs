namespace ArchLucid.Contracts.Findings;

/// <summary>Outcome of a held-check inventory second pass (DX-60).</summary>
public enum HeldCheckSecondPassStatus
{
    Completed,
    NotEligible,
    NoPriorLedger,
    NoNewFindings,
}
