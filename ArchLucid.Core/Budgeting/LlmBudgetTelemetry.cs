using System.Globalization;

namespace ArchLucid.Core.Budgeting;

/// <summary>OpenTelemetry helpers for UTC-month dollar budget gauges (same period key and cap math as monthly dollar budget tracking).</summary>
public static class LlmBudgetTelemetry
{
    /// <summary>Canonical <c>yyyy-MM</c> period key for the current UTC month.</summary>
    public static string CurrentUtcMonthlyPeriodKey()
    {
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        return MonthlyPeriodKey(utcNow);
    }

    /// <summary>UTC-month period key (<c>yyyy-MM</c>) used for <see cref="ILlmTenantBudgetRepository" /> monthly rows.</summary>
    public static string MonthlyPeriodKey(DateTime utcTimestamp)
    {
        return string.Format(
            CultureInfo.InvariantCulture,
            "{0:0000}-{1:00}",
            utcTimestamp.Year,
            utcTimestamp.Month);
    }

    /// <summary>
    ///     Ratio of durable pressure to effective hard cutoff (configured cap + TB-014 bump): <c>TotalUsdPressure / (HardCutoff + PurchasedCapBump)</c>.
    /// </summary>
    public static double MonthlyHardCapUtilizationFraction(
        decimal totalUsdPressure,
        decimal configuredHardCutoffUsdPerUtcMonth,
        decimal purchasedCapBumpUsd)
    {
        decimal pressure = totalUsdPressure < 0m ? 0m : totalUsdPressure;
        decimal denominator = configuredHardCutoffUsdPerUtcMonth + purchasedCapBumpUsd;

        if (denominator <= 0m)
            return 0;

        decimal ratio = pressure / denominator;

        return (double)ratio;
    }

    /// <summary>
    ///     Estimated USD remaining under the UTC-month effective hard cap (<c>max(0, cap - TotalUsdPressure)</c>;
    ///     <c>cap = HardCutoff + PurchasedCapBump</c>).
    /// </summary>
    public static double MonthlyHardCapRemainingUsd(
        decimal totalUsdPressure,
        decimal configuredHardCutoffUsdPerUtcMonth,
        decimal purchasedCapBumpUsd)
    {
        decimal pressure = totalUsdPressure < 0m ? 0m : totalUsdPressure;
        decimal effectiveCap = configuredHardCutoffUsdPerUtcMonth + purchasedCapBumpUsd;

        if (effectiveCap <= 0m)
            return 0;

        decimal headroom = effectiveCap - pressure;

        if (headroom <= 0m)
            return 0;

        return (double)headroom;
    }
}
