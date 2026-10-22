namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AuditEvidenceSnapshotLineageContextRecord
{
    public Guid AssessmentId
    {
        get;
        init;
    }

    public Guid AuditEvidenceSnapshotId
    {
        get;
        init;
    }

    public Guid ControlId
    {
        get;
        init;
    }

    public string ControlNumber
    {
        get;
        init;
    } = string.Empty;

    public string ControlTitle
    {
        get;
        init;
    } = string.Empty;

    public DateTime SnapshotCreatedUtc
    {
        get;
        init;
    }
}
