using ArchLucid.Application.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class WaiverExpiryNotificationBoundaryTests
{
    private static readonly DateTimeOffset NowUtc = new(2026, 8, 12, 13, 45, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(30, 30)]
    [InlineData(-3, -3)]
    public void ResolveDaysRemaining_counts_whole_utc_calendar_days(int offsetDays, int expected)
    {
        int actual = WaiverExpiryNotificationBoundary.ResolveDaysRemaining(NowUtc.AddDays(offsetDays), NowUtc);

        actual.Should().Be(expected);
    }

    [Fact]
    public void ResolveDaysRemaining_ignores_time_of_day_so_repeat_passes_agree()
    {
        DateTimeOffset expiry = new(2026, 8, 20, 0, 5, 0, TimeSpan.Zero);

        int morning = WaiverExpiryNotificationBoundary.ResolveDaysRemaining(
            expiry,
            new DateTimeOffset(2026, 8, 12, 1, 0, 0, TimeSpan.Zero));

        int evening = WaiverExpiryNotificationBoundary.ResolveDaysRemaining(
            expiry,
            new DateTimeOffset(2026, 8, 12, 23, 30, 0, TimeSpan.Zero));

        morning.Should().Be(8);
        evening.Should().Be(8);
    }

    [Theory]
    [InlineData(45, null)]
    [InlineData(31, null)]
    [InlineData(30, 30)]
    [InlineData(20, 30)]
    [InlineData(14, 14)]
    [InlineData(12, 14)]
    [InlineData(7, 7)]
    [InlineData(3, 7)]
    [InlineData(0, 0)]
    [InlineData(-5, 0)]
    public void ResolveEnteredBoundary_returns_tightest_entered_boundary(int daysRemaining, int? expected)
    {
        int? actual = WaiverExpiryNotificationBoundary.ResolveEnteredBoundary(
            daysRemaining,
            GovernanceWaiverExpiryWindow.AlertDayBoundaries);

        actual.Should().Be(expected);
    }

    [Fact]
    public void ResolveEnteredBoundary_returns_null_when_no_boundaries_configured()
    {
        int? actual = WaiverExpiryNotificationBoundary.ResolveEnteredBoundary(0, []);

        actual.Should().BeNull();
    }

    [Fact]
    public void ResolveEnteredBoundary_rejects_null_boundaries()
    {
        Action act = () => WaiverExpiryNotificationBoundary.ResolveEnteredBoundary(0, null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
