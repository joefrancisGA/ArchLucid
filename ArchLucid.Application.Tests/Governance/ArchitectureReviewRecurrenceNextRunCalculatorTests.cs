using ArchLucid.Application.Governance;
using ArchLucid.Decisioning.Advisory.Scheduling;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRecurrenceNextRunCalculatorTests
{
    private readonly ArchitectureReviewRecurrenceNextRunCalculator _sut =
        new(new SimpleScanScheduleCalculator());

    [Fact]
    public void ComputeNextRunUtc_WeeklyMondayAtEight_MatchesDecisioningCalculator()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);

        DateTime? next = _sut.ComputeNextRunUtc("0 8 * * 1", from);

        next.Should().Be(new DateTime(2026, 3, 30, 8, 0, 0, DateTimeKind.Utc));
    }

    [Fact]
    public void ComputeNextRunsUtc_PreviewMatchesBackendSemantics()
    {
        DateTime from = new(2026, 3, 26, 10, 0, 0, DateTimeKind.Utc);
        SimpleScanScheduleCalculator decisioning = new();

        IReadOnlyList<DateTime> applicationRuns = _sut.ComputeNextRunsUtc("0 8 * * 1", from, 5);
        IReadOnlyList<DateTime> decisioningRuns = decisioning.ComputeNextRunsUtc("0 8 * * 1", from, 5);

        applicationRuns.Should().Equal(decisioningRuns);
    }

    [Fact]
    public void IsSupportedCronExpression_RejectsInvalidCron()
    {
        _sut.IsSupportedCronExpression("not-a-real-cron").Should().BeFalse();
    }
}
