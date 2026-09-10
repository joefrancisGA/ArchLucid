namespace ArchLucid.Core.Configuration;

/// <summary>Per-plan hosted LLM estimated-USD band from <see cref="LlmMonthlyTenantDollarBudgetOptions.ByPlan" />.</summary>
public sealed class LlmMonthlyTenantPlanBudgetOptions
{
    public decimal IncludedUsdPerUtcMonth
    {
        get;
        set;
    }

    public decimal HardCutoffUsdPerUtcMonth
    {
        get;
        set;
    }
}
