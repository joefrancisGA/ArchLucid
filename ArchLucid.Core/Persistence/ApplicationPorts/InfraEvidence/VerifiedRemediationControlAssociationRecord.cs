namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>
///     Identifier row that a verified remediation instance, an inventory snapshot, and a control belong together.
///     Snapshot bytes and verification JSON stay in their existing tables.
/// </summary>
public sealed class VerifiedRemediationControlAssociationRecord
{
    public Guid AssociationId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ProjectId
    {
        get;
        init;
    }

    public Guid InstanceId
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

    public Guid? AssessmentId
    {
        get;
        init;
    }

    public DateTime CreatedUtc
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
