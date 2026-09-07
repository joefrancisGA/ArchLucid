namespace ArchLucid.Core.Budgeting;

/// <summary>Product defaults for TB-014 non-expiring LLM wallet.</summary>
public static class LlmTenantWalletDefaults
{
    public const decimal RefillIncrementUsd = 50m;

    public const decimal RefillTriggerThresholdUsd = 10m;

    public const decimal MaxMonthlyAutoReplenishCapUsd = 500m;

    public const decimal MonthlyCapStepUsd = 50m;

    /// <summary>
    ///     Wallet overage is billed above estimated LLM USD so prepaid credits are not sold at COGS.
    /// </summary>
    public const decimal OverageDebitMarkupMultiplier = 1.4m;

    public static decimal ApplyOverageMarkup(decimal estimatedUsd)
    {
        if (estimatedUsd <= 0m)
            return 0m;

        return decimal.Round(estimatedUsd * OverageDebitMarkupMultiplier, 2, MidpointRounding.AwayFromZero);
    }
}
