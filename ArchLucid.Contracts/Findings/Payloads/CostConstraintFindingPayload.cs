namespace ArchLucid.Contracts.Findings.Payloads;

public class CostConstraintFindingPayload
{
    public string BudgetName
    {
        get;
        set;
    } = null!;

    public decimal? MaxMonthlyCost
    {
        get;
        set;
    }

    public string CostRisk
    {
        get;
        set;
    } = null!;

    public decimal? ProjectedImpactUsdLowerBound
    {
        get;
        set;
    }

    public decimal? ProjectedImpactUsdUpperBound
    {
        get;
        set;
    }

    public string? ConfidenceReasoning
    {
        get;
        set;
    }
}
