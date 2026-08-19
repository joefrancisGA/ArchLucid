namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ReReviewScope
{
    public List<string> AffectedElementIds
    {
        get;
        set;
    } = [];

    public bool IncludeGlobalInvariantChecks
    {
        get;
        set;
    } = true;

    public bool FullReReview
    {
        get;
        set;
    }

    public ReReviewTrigger? Trigger
    {
        get;
        set;
    }
}
