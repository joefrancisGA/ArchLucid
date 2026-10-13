namespace ArchLucid.Application.InfraEvidence.RemediationInstances;

/// <summary>
///     Identifier row for a verified remediation association. Snapshot bytes and verification JSON stay in their own tables.
/// </summary>
public sealed class VerifiedRemediationAssociationIdentifier
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
