namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public sealed class ArchitectureDiagramModelPersistRecord
{
    public Guid DiagramModelId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public string ModelJson
    {
        get;
        init;
    } = string.Empty;

    public string ExtractionMethod
    {
        get;
        init;
    } = string.Empty;

    public string? WarningsJson
    {
        get;
        init;
    }

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
