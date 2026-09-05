namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceAskRequest
{
    public string Question
    {
        get;
        set;
    } = string.Empty;

    public Guid? CloudResourceId
    {
        get;
        set;
    }

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

    public DateTimeOffset? SinceUtc
    {
        get;
        set;
    }

    public Guid? DiffId
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

    public bool UseSimulator
    {
        get;
        set;
    }
}
