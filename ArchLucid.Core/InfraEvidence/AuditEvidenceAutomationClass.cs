namespace ArchLucid.Core.InfraEvidence;

/// <summary>Automation posture for an imported audit evidence requirement.</summary>
public enum AuditEvidenceAutomationClass
{
    FullyAutomatable = 0,
    PartiallyAutomatable = 1,
    Manual = 2,
    NotApplicable = 3,
    Unsupported = 4,
}
