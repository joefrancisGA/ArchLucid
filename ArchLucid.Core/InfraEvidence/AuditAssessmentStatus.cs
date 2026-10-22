namespace ArchLucid.Core.InfraEvidence;

/// <summary>Lifecycle of an audit assessment period.</summary>
public enum AuditAssessmentStatus
{
    Draft = 0,
    Collecting = 1,
    Complete = 2,
    Archived = 3,
}
