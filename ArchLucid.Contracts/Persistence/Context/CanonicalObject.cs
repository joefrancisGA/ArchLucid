using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Context;

public class CanonicalObject
{
    public string ObjectId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    private string objectType = string.Empty;

    public string ObjectType
    {
        get => objectType;
        set => objectType = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string name = string.Empty;

    public string Name
    {
        get => name;
        set => name = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string sourceType = string.Empty;

    public string SourceType
    {
        get => sourceType;
        set => sourceType = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private string sourceId = string.Empty;

    public string SourceId
    {
        get => sourceId;
        set => sourceId = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Properties
    {
        get => properties;
        set => properties = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}