namespace ArchLucid.Core.InfraEvidence;

/// <summary>Automation level for remediation pattern execution (Automated does not imply cloud apply).</summary>
public enum RemediationAutomationLevel
{
    Manual = 0,
    Guided = 1,
    SemiAutomated = 2,
    Automated = 3,
}
