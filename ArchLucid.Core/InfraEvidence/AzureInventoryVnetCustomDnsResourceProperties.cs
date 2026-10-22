namespace ArchLucid.Core.InfraEvidence;

public sealed class AzureInventoryVnetCustomDnsResourceProperties
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

    public IReadOnlyDictionary<string, string> Properties
    {
        get;
        init;
    } = new Dictionary<string, string>();
}
