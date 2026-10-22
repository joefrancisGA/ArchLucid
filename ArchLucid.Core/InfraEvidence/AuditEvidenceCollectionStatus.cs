namespace ArchLucid.Core.InfraEvidence;

/// <summary>Outcome of selecting evidence from an inventory snapshot for a requirement.</summary>
public enum AuditEvidenceCollectionStatus
{
    Collected = 0,
    Insufficient = 1,
    Unsupported = 2,
}
