using ArchLucid.Contracts.Serialization;

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

    private List<ArchitectureModelElement> elements = [];

    public List<ArchitectureModelElement> Elements
    {
        get => elements;
        set => elements = ContractCollectionDefaults.Coalesce(value);
    }

    private List<string> declaredPriorities = [];

    public List<string> DeclaredPriorities
    {
        get => declaredPriorities;
        set => declaredPriorities = ContractCollectionDefaults.Coalesce(value);
    }

    private Dictionary<string, string> framingAnswers = new();

    public Dictionary<string, string> FramingAnswers
    {
        get => framingAnswers;
        set => framingAnswers = ContractCollectionDefaults.CoalesceDictionary(value);
    }

    /// <summary>
    /// True when framing questions remain unanswered; specialist Fail conclusions are held as Indeterminate until complete.
    /// </summary>
    public bool IsProvisionalSynthesis
    {
        get;
        set;
    }
}
