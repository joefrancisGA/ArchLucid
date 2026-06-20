namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Post-gate routing for candidate observations after insight-density scoring.
///     Hard suppress is intentionally excluded so demoted candidates remain audit-queryable.
/// </summary>
public enum FindingTreatment
{
    /// <summary>Candidate promoted to the decision-grade findings surface.</summary>
    Promote = 0,

    /// <summary>Candidate demoted to checklist coverage; retained for audit, not hidden.</summary>
    DemoteToChecklist = 1,
}
