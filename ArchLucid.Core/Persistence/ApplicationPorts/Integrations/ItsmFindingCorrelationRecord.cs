namespace ArchLucid.Persistence.Integrations;

/// <summary>Row from <c>dbo.ItsmFindingCorrelations</c> for inbound ITSM webhook routing and outbound linkage display.</summary>
public sealed class ItsmFindingCorrelationRecord
{
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

    public string FindingId
    {
        get;
        init;
    } = null!;

    public string Provider
    {
        get;
        init;
    } = null!;

    public string ExternalKey
    {
        get;
        init;
    } = null!;

    public string? ExternalSysId
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
