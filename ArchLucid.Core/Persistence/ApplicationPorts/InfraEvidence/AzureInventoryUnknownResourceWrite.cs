namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryUnknownResourceWrite
{
    public string AzureResourceId
    {
        get;
        init;
    } = string.Empty;

    public string ResourceType
    {
        get;
        init;
    } = string.Empty;

    public string? ResourceGroup
    {
        get;
        init;
    }

    public string? CappedPropertiesJson
    {
        get;
        init;
    }

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}
