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

    /// <summary>
    ///     Smallest debit <c>dbo.LlmTenantWalletState.BalanceUsd</c> (<c>DECIMAL(10,2)</c>) can record.
    /// </summary>
    public const decimal MinimumBillableOverageUsd = 0.01m;

    public static decimal ApplyOverageMarkup(decimal estimatedUsd)
    {
        if (estimatedUsd <= 0m)
            return 0m;

        decimal markedUsd = decimal.Round(
            estimatedUsd * OverageDebitMarkupMultiplier,
            2,
            MidpointRounding.AwayFromZero);

        // A positive estimate that rounds to $0.00 becomes a zero debit. Authorize then reports
        // balance-after 0 and enqueues auto-refill, and settlement credits the whole pre-call hold back.

        if (markedUsd == 0m)
            return MinimumBillableOverageUsd;

        return markedUsd;
    }
}
