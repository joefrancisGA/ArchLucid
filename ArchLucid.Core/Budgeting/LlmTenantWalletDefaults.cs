namespace ArchLucid.Core.Budgeting;

/// <summary>Product defaults for TB-014 non-expiring LLM wallet.</summary>
public static class LlmTenantWalletDefaults
{
    public const decimal RefillIncrementUsd = 50m;

    public const decimal RefillTriggerThresholdUsd = 10m;

    public const decimal MaxMonthlyAutoReplenishCapUsd = 500m;

    public const decimal MonthlyCapStepUsd = 50m;
}
