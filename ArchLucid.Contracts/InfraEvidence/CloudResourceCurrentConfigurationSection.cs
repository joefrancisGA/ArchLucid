using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceCurrentConfigurationSection
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public string AzureResourceId
    {
        get;
        set;
    } = string.Empty;

    public string ResourceType
    {
        get;
        set;
    } = string.Empty;

    public string? ResourceGroup
    {
        get;
        set;
    }

    public string? Region
    {
        get;
        set;
    }

    private Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Properties
    {
        get => properties;
        set => properties = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }

    private Dictionary<string, string> tags = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Tags
    {
        get => tags;
        set => tags = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}
