using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Roi;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RoiSponsorFacingScopeDescriptionsTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void Scope_descriptions_render_both_window_bounds_in_utc(bool pilotScorecard)
    {
        DateTimeOffset from = new(2026, 5, 25, 1, 0, 0, TimeSpan.FromHours(2));
        DateTimeOffset to = new(2026, 5, 26, 23, 0, 0, TimeSpan.FromHours(-4));

        string description = pilotScorecard
            ? RoiSponsorFacingScopeDescriptions.ForPilotScorecardWindow(from, to)
            : RoiSponsorFacingScopeDescriptions.ForValueReportWindow(from, to);

        description.Should().EndWith("2026-05-24T23:00:00.0000000+00:00 → 2026-05-27T03:00:00.0000000+00:00.");
    }
}
