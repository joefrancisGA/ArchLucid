namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ArchitectureKnowledgeModel
{
    public string ModelId
    {
        get;
        set;
    } = null!;

    public string TenantId
    {
        get;
        set;
    } = null!;

    public string? RunId
    {
        get;
        set;
    }

    public int SchemaVersion
    {
        get;
        set;
    } = ArchitectureIntelligenceSchema.CurrentModelVersion;

    public DateTime CreatedUtc
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }

    public List<ArchitectureModelElement> Elements
    {
        get;
        set;
    } = [];

    public List<string> DeclaredPriorities
    {
        get;
        set;
    } = [];

    public Dictionary<string, string> FramingAnswers
    {
        get;
        set;
    } = new();
}
