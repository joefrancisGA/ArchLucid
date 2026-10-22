namespace ArchLucid.Contracts.Findings.Payloads;

public class CostBreachFindingPayload
{
    public string BudgetName
    {
        get;
        set;
    } = null!;

    public decimal MaxMonthlyCost
    {
        get;
        set;
    }

    public decimal ProjectedMonthlySpendUsd
    {
        get;
        set;
    }

    public decimal BreachAmountUsd
    {
        get;
        set;
    }

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
}
