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

    public ClaimProvenance Provenance
    {
        get;
        set;
    } = new();

    /// <summary>Extraction confidence in [0, 1].</summary>
    public double ExtractionConfidence
    {
        get;
        set;
    }

    public List<string> SourcePassageIds
    {
        get;
        set;
    } = [];

    public List<string> RelatedElementIds
    {
        get;
        set;
    } = [];

    public Dictionary<string, string> Properties
    {
        get;
        set;
    } = new();

    /// <summary>Whether the element describes as-is, to-be, or transitional architecture state.</summary>
    public ArchitectureLifecycleScope LifecycleScope
    {
        get;
        set;
    } = ArchitectureLifecycleScope.Unspecified;
}
