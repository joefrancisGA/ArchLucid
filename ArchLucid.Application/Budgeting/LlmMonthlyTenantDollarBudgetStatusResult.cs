namespace ArchLucid.Application.Budgeting;

/// <summary>Wire + UI projection of monthly LLM dollar budget (non-secrets).</summary>
public sealed class LlmMonthlyTenantDollarBudgetStatusResult
{
    /// <summary>True when <c>LlmMonthlyTenantDollarBudget:Enabled</c> and a positive hard cutoff is configured.</summary>
    public bool MonthlyBudgetMonitoringActive
    {
        get;
        init;
    }

    /// <summary>
    ///     True when the next assumed reservation would exceed the effective hard cap (pressure + assumed above cap +
    ///     bump).
    /// </summary>
    public bool BlocksAdditionalLlmExecution
    {
        get;
        init;
    }

    /// <summary>UTC month label <c>yyyy-MM</c> for the evaluated row.</summary>
    public string UtcMonth
    {
        get;
        init;
    } = string.Empty;

    public decimal? HardCutoffUsdPerUtcMonth
    {
        get;
        init;
    }

    public decimal? EffectiveHardCapUsd
    {
        get;
        init;
    }

    public decimal? PurchasedCapBumpUsd
    {
        get;
        init;
    }

    public decimal? EstimatedUsdPressure
    {
        get;
        init;
    }

    public decimal? AssumedNextCallReservationUsd
    {
        get;
        init;
    }

    /// <summary>
    ///     <c>TotalUsdPressure / (HardCutoff + PurchasedCapBump)</c> when monitoring is active; same math as
    ///     <see cref="ArchLucid.Core.Budgeting.LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction" />.
    /// </summary>
    public double? HardCapUtilizationFraction
    {
        get;
        init;
    }

    /// <summary>Configured <c>LlmMonthlyTenantDollarBudget:WarnFraction</c> (clamped 0.01–0.99) for operator UI thresholds.</summary>
    public decimal? WarnFraction
    {
        get;
        init;
    }
}
