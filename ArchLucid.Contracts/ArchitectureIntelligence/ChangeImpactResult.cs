using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ChangeImpactResult
{
    public string RecommendationId
    {
        get;
        set;
    } = null!;

    private List<ChangeImpactItem> impactedItems = [];

    public List<ChangeImpactItem> ImpactedItems
    {
        get => impactedItems;
        set => impactedItems = ContractCollectionDefaults.Coalesce(value);
    }

    public string GraphCompletenessCaveat
    {
        get;
        set;
    } = "Impact analysis is limited to elements linked in the knowledge model graph.";

    public bool RequiresFullReReview
    {
        get;
        set;
    }
}
