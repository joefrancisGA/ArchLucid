using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class TradeOffObject
{
    public string TradeOffId
    {
        get;
        set;
    } = null!;

    public string ProposedDecision
    {
        get;
        set;
    } = null!;

    public string Benefit
    {
        get;
        set;
    } = null!;

    public string CostOrRisk
    {
        get;
        set;
    } = null!;

    private List<string> competingPositions = [];

    public List<string> CompetingPositions
    {
        get => competingPositions;
        set => competingPositions = ContractCollectionDefaults.Coalesce(value);
    }

    public string? RecommendedResolution
    {
        get;
        set;
    }

    public string? ResolutionRationale
    {
        get;
        set;
    }

    public bool RequiresHumanApproval
    {
        get;
        set;
    }
}
