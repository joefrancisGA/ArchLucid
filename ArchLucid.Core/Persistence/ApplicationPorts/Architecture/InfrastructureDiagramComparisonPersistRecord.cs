namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class InfrastructureDiagramComparisonPersistRecord
{
    public Guid ComparisonId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid SnapshotId
    {
        get;
        init;
    }

    public string SourcesJson
    {
        get;
        init;
    } = string.Empty;

    public string ResultJson
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
