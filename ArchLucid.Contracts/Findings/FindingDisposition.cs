namespace ArchLucid.Contracts.Findings;

/// <summary>Operator disposition on an architecture finding (TB-058).</summary>
public enum FindingDisposition
{
    Accepted = 0,
    Deferred = 1,
    NeedsEvidence = 2,
    Remediated = 3,
    RejectedAsNotApplicable = 4,
}
