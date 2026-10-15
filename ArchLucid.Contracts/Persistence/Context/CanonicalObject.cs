using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Context;

public class CanonicalObject
{
    public string ObjectId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    public string ObjectType
    {
        get;
        set;
    } = null!;

    private string name = string.Empty;

    public string Name
    {
        get => name;
        set => name = ContractCollectionDefaults.CoalesceRequired(value);
    }

    public string SourceType
    {
        get;
        set;
    } = null!;

    public string SourceId
    {
        get;
        set;
    } = null!;

    private Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Properties
    {
        get => properties;
        set => properties = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(value);
    }
}
