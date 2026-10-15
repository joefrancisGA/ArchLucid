using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

/// <summary>
/// Explicit before/after model delta used by change-impact analysis (TB-1987).
/// </summary>
public class ArchitectureModelDiff
{
    public string RecommendationId
    {
        get;
        set;
    } = string.Empty;

    private List<ArchitectureModelDiffEntry> entries = [];

    public List<ArchitectureModelDiffEntry> Entries
    {
        get => entries;
        set => entries = ContractCollectionDefaults.Coalesce(value);
    }

    private ArchitectureKnowledgeModel beforeModel = new();

    public ArchitectureKnowledgeModel BeforeModel
    {
        get => beforeModel;
        set => beforeModel = value ?? new ArchitectureKnowledgeModel();
    }

    private ArchitectureKnowledgeModel afterModel = new();

    public ArchitectureKnowledgeModel AfterModel
    {
        get => afterModel;
        set => afterModel = value ?? new ArchitectureKnowledgeModel();
    }
}
