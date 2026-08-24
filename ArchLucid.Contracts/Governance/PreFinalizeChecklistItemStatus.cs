namespace ArchLucid.Contracts.Governance;

/// <summary>Pre-finalize checklist row severity before commit.</summary>
public enum PreFinalizeChecklistItemStatus
{
    Clear = 0,
    Advisory = 1,
    Blocking = 2,
}
