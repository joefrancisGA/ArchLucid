namespace ArchLucid.Core.InfraEvidence;

/// <summary>Lifecycle status for a remediation pattern version.</summary>
public enum RemediationPatternStatus
{
    Draft = 0,
    UnderReview = 1,
    Approved = 2,
    Deprecated = 3,
    Retired = 4,
}
