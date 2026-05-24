namespace ArchLucid.Persistence.Integrations;

/// <summary>Row from <c>dbo.ItsmFindingCorrelations</c> for inbound ITSM webhook routing.</summary>
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
}
