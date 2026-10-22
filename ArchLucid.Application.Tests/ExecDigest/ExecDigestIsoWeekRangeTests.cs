using ArchLucid.Application.ExecDigest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.ExecDigest;

[Trait("Category", "Unit")]
public sealed class ExecDigestIsoWeekRangeTests
{
    [Fact]
    public void Parse_returns_monday_start_and_seven_day_window()
    {
        (DateTime startUtc, DateTime endUtc) = ExecDigestIsoWeekRange.Parse("2026-W33");

        startUtc.Should().Be(new DateTime(2026, 8, 10, 0, 0, 0, DateTimeKind.Utc));
        endUtc.Should().Be(startUtc.AddDays(7));
    }
}
