namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryResourcePropertyWrite
{
    public Guid ResourceRowId
    {
        get;
        init;
    }

    public string PropertyKey
    {
        get;
        init;
    } = string.Empty;

    public string? PropertyValue
    {
        get;
        init;
    }

    public bool IsRedacted
    {
        get;
        init;
    }
}
