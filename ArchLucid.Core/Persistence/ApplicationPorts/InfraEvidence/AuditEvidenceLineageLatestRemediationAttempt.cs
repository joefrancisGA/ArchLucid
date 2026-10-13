using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>
/// One remediation instance that tried this control and is not already listed as a verified association.
/// Identifiers only. Not an auditor conclusion and not a score.
/// </summary>
public sealed class AuditEvidenceLineageLatestRemediationAttempt
{
    public Guid InstanceId
    {
        get;
        init;
    }

    public RemediationInstanceStatus Status
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
