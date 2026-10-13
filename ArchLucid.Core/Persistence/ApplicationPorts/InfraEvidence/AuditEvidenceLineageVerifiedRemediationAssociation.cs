using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>
///     Identifier row for a verified remediation cited on audit evidence lineage. Context only; not an auditor conclusion.
/// </summary>
public sealed class AuditEvidenceLineageVerifiedRemediationAssociation
{
    public Guid AssociationId
    {
        get;
        init;
    }

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

    public Guid VerificationSnapshotId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }
}
