using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Context;

public class ContextSnapshot
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    /// <summary>Logical project/system key (used for latest snapshot queries).</summary>
    public string ProjectId
    {
        get;
        set;
    } = "";

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    private List<CanonicalObject> canonicalObjects = [];

    public List<CanonicalObject> CanonicalObjects
    {
        get => canonicalObjects;
        set => canonicalObjects = ContractCollectionDefaults.Coalesce(value);
    }

    public string? DeltaSummary
    {
        get;
        set;
    }

    private List<string> warnings = [];

    public List<string> Warnings
    {
        get => warnings;
        set => warnings = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> errors = [];

    public List<string> Errors
    {
        get => errors;
        set => errors = ContractCollectionDefaults.Coalesce(value);
    }

    private Dictionary<string, string> sourceHashes = [];

    public Dictionary<string, string> SourceHashes
    {
        get => sourceHashes;
        set => sourceHashes = ContractCollectionDefaults.CoalesceDictionary(value);
    }
}
