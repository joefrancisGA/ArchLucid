using ArchLucid.Decisioning.Advisory.Scheduling;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Tests for Simple Scan Schedule Calculator.
/// </summary>
[Trait("Category", "Unit")]
public sealed class SimpleScanScheduleCalculatorTests
{
    private readonly SimpleScanScheduleCalculator _sut = new();

    [Fact]
    public void ComputeNextRunUtc_Hourly_AddsOneHour()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("@hourly", from);

        next.Should().Be(from.AddHours(1));
    }

    [Fact]
    public void ComputeNextRunUtc_Daily_AddsOneDay()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("@daily", from);

        next.Should().Be(from.AddDays(1));
    }

    [Fact]
    public void ComputeNextRunUtc_Weekly_AddsSevenDays()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("@weekly", from);

        next.Should().Be(from.AddDays(7));
    }

    [Fact]
    public void ComputeNextRunUtc_DailyAtSeven_BeforeSevenSameDay_ReturnsSevenToday()
    {
        DateTime from = new(2026, 3, 26, 5, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 7 * * *", from);

        next.Should().Be(new DateTime(2026, 3, 26, 7, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunUtc_DailyAtSeven_AfterSeven_ReturnsSevenNextDay()
    {
        DateTime from = new(2026, 3, 26, 8, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 7 * * *", from);

        next.Should().Be(new DateTime(2026, 3, 27, 7, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunUtc_WeeklyMondayAtEight_ReturnsNextMondayAtEightUtc()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 8 * * 1", from);

        next.Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunsUtc_WeeklyMondayAtEight_ProducesFiveWeeklyRuns()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        IReadOnlyList<DateTime> runs = _sut.ComputeNextRunsUtc("0 8 * * 1", from, 5);

        runs.Should().HaveCount(5);
        runs[0].Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
        runs[1].Should().Be(new DateTime(2026, 4, 6, 8, 0, 0, DateTimeKind.Utc));
        runs[4].Should().Be(new DateTime(2026, 4, 27, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunUtc_UnknownExpression_ReturnsNull()
    {
        DateTime from = new(2026, 3, 26, 12, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("not-a-real-cron", from);

        next.Should().BeNull();
    }

    [Fact]
    public void IsSupportedCronExpression_RejectsUnknownExpression()
    {
        _sut.IsSupportedCronExpression("not-a-real-cron").Should().BeFalse();
    }

    [Fact]
    public void IsSupportedCronExpression_AcceptsPresetsAndWeeklyMondayCron()
    {
        _sut.IsSupportedCronExpression("@hourly").Should().BeTrue();
        _sut.IsSupportedCronExpression("@daily").Should().BeTrue();
        _sut.IsSupportedCronExpression("@weekly").Should().BeTrue();
        _sut.IsSupportedCronExpression("0 7 * * *").Should().BeTrue();
        _sut.IsSupportedCronExpression("0 8 * * 1").Should().BeTrue();
    }

    [Fact]
    public void ComputeNextRunUtc_TrimsWhitespace()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("  @daily  ", from);

        next.Should().Be(from.AddDays(1));
    }
}
