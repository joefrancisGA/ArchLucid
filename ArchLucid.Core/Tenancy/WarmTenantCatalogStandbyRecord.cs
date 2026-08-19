namespace ArchLucid.Core.Tenancy;

public sealed class WarmTenantCatalogStandbyRecord
{
    public Guid StandbyId
    {
        get;
        init;
    }

    public string SqlLogicalDatabaseName
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset SchemaReadyUtc
    {
        get;
        init;
    }

    public DateTimeOffset CreatedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? ClaimedUtc
    {
        get;
        init;
    }
}
