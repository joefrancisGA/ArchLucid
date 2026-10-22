namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceAuditLineageMatch
{
    public Guid AssessmentId
    {
        get;
        set;
    }

    public Guid AuditEvidenceSnapshotId
    {
        get;
        set;
    }

    public Guid ControlId
    {
        get;
        set;
    }

    public string ControlNumber
    {
        get;
        set;
    } = string.Empty;

    public string ControlTitle
    {
        get;
        set;
    } = string.Empty;

    public DateTime SnapshotCreatedUtc
    {
        get;
        set;
    }
}
