using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ReReviewScope
{
    private List<string> affectedElementIds = [];

    public List<string> AffectedElementIds
    {
        get => affectedElementIds;
        set => affectedElementIds = ContractCollectionDefaults.Coalesce(value);
    }

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
