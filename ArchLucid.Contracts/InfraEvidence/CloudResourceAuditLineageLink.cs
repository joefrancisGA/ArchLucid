namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceAuditLineageLink
{
    public bool Available
    {
        get;
        set;
    }

    public string? RelativePath
    {
        get;
        set;
    }

    public string? DegradedReason
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

    public string? ControlNumber
    {
        get;
        set;
    }

    public string? ControlTitle
    {
        get;
        set;
    }

    public IReadOnlyList<CloudResourceAuditLineageMatch> Matches
    {
        get;
        set;
    } = [];
}
