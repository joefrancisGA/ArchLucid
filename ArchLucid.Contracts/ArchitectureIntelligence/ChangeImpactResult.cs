namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ChangeImpactResult
{
    public string RecommendationId
    {
        get;
        set;
    } = null!;

    public List<ChangeImpactItem> ImpactedItems
    {
        get;
        set;
    } = [];

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
