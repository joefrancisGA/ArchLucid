using System.Globalization;

using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BoardPackQuarterWindowTests
{
    [Fact]
    public void Resolve_returns_calendar_quarter_window_when_overrides_absent()
    {
        (DateTimeOffset startUtc, DateTimeOffset endUtc) =
            BoardPackQuarterWindow.Resolve(2026, 1, null, null);

        startUtc.Should().Be(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        endUtc.Should().Be(new DateTimeOffset(2026, 4, 1, 0, 0, 0, TimeSpan.Zero));
    }

    [Fact]
    public void Resolve_uses_override_window_when_both_bounds_are_set()
    {
        DateTimeOffset overrideStart = new(2026, 2, 10, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset overrideEnd = new(2026, 3, 5, 0, 0, 0, TimeSpan.Zero);

        (DateTimeOffset startUtc, DateTimeOffset endUtc) =
            BoardPackQuarterWindow.Resolve(2026, 1, overrideStart, overrideEnd);

        startUtc.Should().Be(overrideStart);
        endUtc.Should().Be(overrideEnd);
    }

    [Fact]
    public void Resolve_throws_when_override_end_is_not_after_start()
    {
        DateTimeOffset overrideStart = new(2026, 3, 5, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset overrideEnd = new(2026, 2, 10, 0, 0, 0, TimeSpan.Zero);

        Action act = () => BoardPackQuarterWindow.Resolve(2026, 1, overrideStart, overrideEnd);

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("overrideEndUtc");
    }

    [Fact]
    public void DigestWeekInsideQuarter_returns_seven_day_window_inside_quarter()
    {
        DateTimeOffset quarterStart = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);
        DateTimeOffset quarterEnd = new(2026, 4, 1, 0, 0, 0, TimeSpan.Zero);

        (DateTime weekStartUtc, DateTime weekEndUtc) =
            BoardPackQuarterWindow.DigestWeekInsideQuarter(quarterStart, quarterEnd);

        weekEndUtc.Should().Be(weekStartUtc.AddDays(7));
        weekStartUtc.Should().BeOnOrAfter(quarterStart.UtcDateTime);
        weekEndUtc.Should().BeOnOrBefore(quarterEnd.UtcDateTime.AddDays(7));
    }

    [Theory]
    [InlineData("2026-03-25T00:00:00Z", "2026-04-01T00:00:00Z")]
    [InlineData("2026-03-23T00:00:00Z", "2026-03-27T00:00:00Z")]
    public void DigestWeekInsideQuarter_keeps_digest_week_inside_requested_window(string startIso, string endIso)
    {
        DateTimeOffset windowStart = DateTimeOffset.Parse(startIso, CultureInfo.InvariantCulture);
        DateTimeOffset windowEnd = DateTimeOffset.Parse(endIso, CultureInfo.InvariantCulture);

        (DateTime weekStartUtc, DateTime weekEndUtc) =
            BoardPackQuarterWindow.DigestWeekInsideQuarter(windowStart, windowEnd);

        weekStartUtc.Should().BeOnOrAfter(windowStart.UtcDateTime);
        weekEndUtc.Should().BeOnOrBefore(windowEnd.UtcDateTime);
        weekEndUtc.Should().BeAfter(weekStartUtc);
    }
}
