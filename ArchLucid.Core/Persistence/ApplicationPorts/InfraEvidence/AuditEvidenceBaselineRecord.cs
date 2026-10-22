namespace ArchLucid.Persistence.InfraEvidence;

/// <summary>Named audit evidence baseline (distinct from infrastructure baseline IE-07).</summary>
public sealed class AuditEvidenceBaselineRecord
{
    public Guid BaselineId
    {
        get;
        init;
    }

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

    public Guid TenantId
    {
        get;
        init;
    }

    public string Name
    {
        get;
        init;
    } = string.Empty;

    public string DesignatedBy
    {
        get;
        init;
    } = string.Empty;

    public DateTime DesignatedUtc
    {
        get;
        init;
    }
}
