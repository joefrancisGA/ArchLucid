using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Artifacts;

public class SynthesisTrace
{
    public Guid TraceId
    {
        get;
        set;
    }

    public Guid RunId
    {
        get;
        set;
    }

    public Guid ManifestId
    {
        get;
        set;
    }

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    private List<string> generatorsUsed = [];

    public List<string> GeneratorsUsed
    {
        get => generatorsUsed;
        set => generatorsUsed = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> sourceDecisionIds = [];

    public List<string> SourceDecisionIds
    {
        get => sourceDecisionIds;
        set => sourceDecisionIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> notes = [];

    public List<string> Notes
    {
        get => notes;
        set => notes = ContractCollectionDefaults.Coalesce(value);
    }
}

