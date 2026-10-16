using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureModelElement
{
    public string ElementId
    {
        get;
        set;
    } = null!;

    public ArchitectureElementKind Kind
    {
        get;
        set;
    }

    public string Name
    {
        get;
        set;
    } = null!;

    public string? Description
    {
        get;
        set;
    }

    private ClaimProvenance provenance = new();

    public ClaimProvenance Provenance
    {
        get => provenance;
        set => provenance = value ?? new ClaimProvenance();
    }

    /// <summary>Extraction confidence in [0, 1].</summary>
    public double ExtractionConfidence
    {
        get;
        set;
    }

    private List<string> sourcePassageIds = [];

    public List<string> SourcePassageIds
    {
        get => sourcePassageIds;
        set => sourcePassageIds = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> relatedElementIds = [];

    public List<string> RelatedElementIds
    {
        get => relatedElementIds;
        set => relatedElementIds = ContractCollectionDefaults.Coalesce(value);
    }

    private Dictionary<string, string> properties = new();

    public Dictionary<string, string> Properties
    {
        get => properties;
        set => properties = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    /// <summary>Whether the element describes as-is, to-be, or transitional architecture state.</summary>
    public ArchitectureLifecycleScope LifecycleScope
    {
        get;
        set;
    } = ArchitectureLifecycleScope.Unspecified;
}
