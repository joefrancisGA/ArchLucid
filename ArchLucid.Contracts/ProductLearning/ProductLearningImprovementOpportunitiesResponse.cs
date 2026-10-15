using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning;

/// <summary>Ranked improvement opportunities for the current scope and query window.</summary>
public sealed class ProductLearningImprovementOpportunitiesResponse
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    private IReadOnlyList<ImprovementOpportunity> opportunities = [];

    public IReadOnlyList<ImprovementOpportunity> Opportunities
    {
        get => opportunities;
        init => opportunities = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
