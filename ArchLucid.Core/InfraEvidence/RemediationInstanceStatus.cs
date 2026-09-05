namespace ArchLucid.Core.InfraEvidence;

/// <summary>Governed remediation instance lifecycle (IE-13).</summary>
public enum RemediationInstanceStatus
{
    Classified = 0,
    PreflightPassed = 1,
    PreflightBlocked = 2,
    Approved = 3,
    WaveAssigned = 4,
    Executed = 5,
    Verified = 6,
    VerificationFailed = 7,
    Closed = 8,
}
