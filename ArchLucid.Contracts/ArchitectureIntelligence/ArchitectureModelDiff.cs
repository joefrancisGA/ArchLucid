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

    public ArchitectureKnowledgeModel BeforeModel
    {
        get;
        set;
    } = new();

    public ArchitectureKnowledgeModel AfterModel
    {
        get;
        set;
    } = new();
}
