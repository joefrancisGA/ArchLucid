namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryTagWrite
{
    public Guid ResourceRowId
    {
        get;
        init;
    }

    public string TagKey
    {
        get;
        init;
    } = string.Empty;

    public string? TagValue
    {
        get;
        init;
    }
}
