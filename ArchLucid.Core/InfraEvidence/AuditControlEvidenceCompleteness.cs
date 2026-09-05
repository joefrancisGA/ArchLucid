namespace ArchLucid.Core.InfraEvidence;

/// <summary>How completely evidence is demonstrated for a control (readiness dimension, not technical pass/fail).</summary>
public enum AuditControlEvidenceCompleteness
{
    LackingEvidence = 0,
    PartiallyEvident = 1,
    FullyEvident = 2,
}
