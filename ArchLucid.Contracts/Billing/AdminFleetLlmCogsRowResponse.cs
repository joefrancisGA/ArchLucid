namespace ArchLucid.Contracts.Billing;

/// <summary>Platform-admin fleet row for estimated tenant LLM COGS and budget posture (Batch B item 18).</summary>
public sealed class AdminFleetLlmCogsRowResponse
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string TenantName
    {
        get;
        init;
    } = string.Empty;

    public decimal EstimatedUsdPressureUtcMonth
    {
        get;
        init;
    }

    public decimal? HardCapUsdUtcMonth
    {
        get;
        init;
    }

    public bool BlocksAdditionalLlmExecution
    {
        get;
        init;
    }

    public double? HardCapUtilizationFraction
    {
        get;
        init;
    }

    /// <summary><c>healthy</c>, <c>warn</c>, or <c>risk</c> gross-margin posture label.</summary>
    public string GrossMarginRiskLabel
    {
        get;
        init;
    } = "healthy";

    public DateTimeOffset? TrialFirstManifestCommittedUtc
    {
        get;
        init;
    }

    public string CostBasisLabel
    {
        get;
        init;
    } = "estimated";

    public bool MonthlyBudgetMonitoringActive
    {
        get;
        init;
    }

    public bool CostRatesConfigured
    {
        get;
        init;
    }

    public decimal? IncludedUsdUtcMonth
    {
        get;
        init;
    }

    public decimal? BudgetWarningUsdUtcMonth
    {
        get;
        init;
    }

    public string BudgetCompletionLabel
    {
        get;
        init;
    } = "unknown";
}

public sealed class AdminFleetLlmCogsDashboardResponse
{
    public List<AdminFleetLlmCogsRowResponse> Rows
    {
        get;
        init;
    } = [];

    public string UtcMonth
    {
        get;
        init;
    } = string.Empty;

    public string CostBasisLabel
    {
        get;
        init;
    } = "estimated";

    public bool MonthlyBudgetMonitoringActive
    {
        get;
        init;
    }

    public bool CostRatesConfigured
    {
        get;
        init;
    }

    public int BudgetWarningTenantCount
    {
        get;
        init;
    }

    public int HardStopTenantCount
    {
        get;
        init;
    }

    public int MissingRateTenantCount
    {
        get;
        init;
    }
}
