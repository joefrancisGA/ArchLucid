namespace ArchLucid.Persistence.Telemetry;

/// <summary>One <c>dbo.FirstTenantFunnelEvents</c> row for cold archival.</summary>
public sealed class FirstTenantFunnelArchiveRow
{
    public long EventId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string EventName
    {
        get;
        init;
    } = null!;

    public DateTime OccurredUtc
    {
        get;
        init;
    }
}
