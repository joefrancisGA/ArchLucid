namespace ArchLucid.Core.InfraEvidence;

/// <summary>Technical control timeline states (not attestation or CMS conformity labels).</summary>
public enum AuditControlTechnicalTimelineState
{
    TechnicallySupported = 0,
    DriftDetected = 1,
    AtRisk = 2,
    RemediationInProgress = 3,
    Verified = 4,
}
