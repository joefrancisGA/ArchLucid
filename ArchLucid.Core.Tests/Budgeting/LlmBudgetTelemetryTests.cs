using ArchLucid.Core.Budgeting;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Budgeting;

public sealed class LlmBudgetTelemetryTests
{
    [Fact]
    public void MonthlyHardCapUtilizationFraction_matchesConfiguredHardCutoffAndPressure()
    {
        double fraction = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(
            totalUsdPressure: 37.5m,
            configuredHardCutoffUsdPerUtcMonth: 50m,
            purchasedCapBumpUsd: 0m);

        fraction.Should().BeApproximately(0.75, precision: 1e-8);
    }

    [Fact]
    public void MonthlyHardCapUtilizationFraction_includesPurchasedCapBumpInDenominator()
    {
        double fraction = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(
            totalUsdPressure: 100m,
            configuredHardCutoffUsdPerUtcMonth: 50m,
            purchasedCapBumpUsd: 50m);

        fraction.Should().BeApproximately(1.0, precision: 1e-8);
    }

    [Fact]
    public void MonthlyHardCapUtilizationFraction_whenDenominatorNotPositive_returnsZero()
    {
        double zeroDenom = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(10m, 0m, 0m);

        zeroDenom.Should().Be(0);

        double negativeNet = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(10m, -5m, 4m);

        negativeNet.Should().Be(0);
    }

    [Fact]
    public void MonthlyHardCapUtilizationFraction_whenPressureNegative_treatsPressureAsZero()
    {
        double fraction = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(-3m, 100m, 0m);

        fraction.Should().Be(0);
    }

    [Fact]
    public void MonthlyPeriodKey_formatsUtcYearMonth()
    {
        DateTime utc = new DateTime(2026, 3, 17, 12, 0, 0, DateTimeKind.Utc);

        LlmBudgetTelemetry.MonthlyPeriodKey(utc).Should().Be("2026-03");
    }

    [Fact]
    public void MonthlyHardCapRemainingUsd_subtractsPressureFromEffectiveCap()
    {
        double remaining =
            LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(12.5m, 50m, 10m); // Effective cap $60 → $47.50 headroom.

        remaining.Should().BeApproximately(47.5, precision: 1e-8);
    }

    [Fact]
    public void MonthlyHardCapRemainingUsd_whenAtOrOverEffectiveCap_returnsZeroAndIsNeverNegative()
    {
        double atCap = LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(75m, 50m, 25m);

        atCap.Should().Be(0);

        double exhausted = LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(900m, 50m, 0m);

        exhausted.Should().Be(0);
    }

    [Fact]
    public void MonthlyHardCapRemainingUsd_whenCapNotPositive_returnsZero()
    {
        LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(5m, 0m, 0m).Should().Be(0);
        LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(5m, -6m, 5m).Should().Be(0);
    }

    [Fact]
    public void MonthlyHardCapRemainingUsd_whenPressureNegative_treatsPressureAsZeroAndIsNonNegative()
    {
        double remaining = LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(-4m, 30m, 5m); // Effective cap $35.

        remaining.Should().BeApproximately(35d, precision: 1e-8);
        remaining.Should().BeGreaterThanOrEqualTo(0);
    }
}
