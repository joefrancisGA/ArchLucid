namespace ArchLucid.Core.InfraEvidence;

/// <summary>How audit evidence snapshots are filtered when read.</summary>
public enum AuditEvidenceReadMode
{
    Current = 0,
    AssessmentPeriod = 1,
    Historical = 2,
    Baseline = 3,
}
