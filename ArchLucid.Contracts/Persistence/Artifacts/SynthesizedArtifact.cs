using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Persistence.Artifacts;

public class SynthesizedArtifact
{
    public Guid ArtifactId
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

    public string ArtifactType
    {
        get;
        set;
    } = null!;

    public string Name
    {
        get;
        set;
    } = null!;

    public string Format
    {
        get;
        set;
    } = null!;

    public string Content
    {
        get;
        set;
    } = null!;

    public string ContentHash
    {
        get;
        set;
    } = null!;

    /// <summary>Row-level synthesis outcome for this artifact slice.</summary>
    private SynthesizedArtifactGenerationStatus status = SynthesizedArtifactGenerationStatus.Generated;

    public SynthesizedArtifactGenerationStatus Status
    {
        get => status;
        set => status = ContractCollectionDefaults.CoalesceInvalidEnumZero(
            value,
            SynthesizedArtifactGenerationStatus.Generated);
    }

    private Dictionary<string, string> metadata = new();

    public Dictionary<string, string> Metadata
    {
        get => metadata;
        set => metadata = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    /// <summary>Architecture decisions that contributed to this artifact (provenance / explainability).</summary>
    private List<string> contributingDecisionIds = [];

    public List<string> ContributingDecisionIds
    {
        get => contributingDecisionIds;
        set => contributingDecisionIds = ContractCollectionDefaults.Coalesce(value);
    }
}

