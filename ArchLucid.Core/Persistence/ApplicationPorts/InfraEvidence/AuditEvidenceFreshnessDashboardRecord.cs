namespace ArchLucid.Persistence.InfraEvidence;

using ArchLucid.Core.InfraEvidence;

public sealed class AuditEvidenceFreshnessDashboardRecord
{
    public int CurrentCount
    {
        get;
        init;
    }

    public int FreshCount
    {
        get;
        init;
    }

    public int AgingCount
    {
        get;
        init;
    }

    public int StaleCount
    {
        get;
        init;
    }

    public int ExpiredCount
    {
        get;
        init;
    }

    public int UnknownCount
    {
        get;
        init;
    }

    public int MissingCount
    {
        get;
        init;
    }

    public int RecollectCount
    {
        get;
        init;
    }

    public int ManualCount
    {
        get;
        init;
    }
}

public sealed class AuditEvidenceFreshnessItemUpdate
{
    public Guid EvidenceRowId
    {
        get;
        init;
    }

    public AuditEvidenceFreshnessStatus FreshnessStatus
    {
        get;
        init;
    }
}
