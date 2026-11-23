namespace ArchLucid.Core.InfraEvidence;

/// <summary>Immutable remediation evidence phases (IE-13).</summary>
public enum RemediationEvidencePhase
{
    Before = 0,
    ExecuteRequest = 1,
    ExecuteResult = 2,
    Verify = 3,
    /// <summary>Atomic instance-approval provenance; not an approved FND-015 execution plan.</summary>
    Approval = 4,
}
