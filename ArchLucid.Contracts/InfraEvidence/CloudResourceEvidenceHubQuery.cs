namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceEvidenceHubQuery
{
    public Guid? RunId
    {
        get;
        set;
    }

    public Guid? SnapshotId
    {
        get;
        set;
    }

    public Guid? AssessmentId
    {
        get;
        set;
    }

    public Guid? AuditEvidenceSnapshotId
    {
        get;
        set;
    }

    public Guid? ControlId
    {
        get;
        set;
    }

    public int Page
    {
        get;
        set;
    } = 1;

    public int PageSize
    {
        get;
        set;
    } = 50;
}
