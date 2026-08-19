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

    public List<string> CompetingPositions
    {
        get;
        set;
    } = [];

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
