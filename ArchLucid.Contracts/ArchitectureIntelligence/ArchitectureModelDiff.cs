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

    public List<ArchitectureModelDiffEntry> Entries
    {
        get;
        set;
    } = [];

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
