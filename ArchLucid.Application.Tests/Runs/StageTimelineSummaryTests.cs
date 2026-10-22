using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

/// <summary>TB-250 stage timeline duration derivation.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class StageTimelineSummaryTests
{
    [Fact]
    public void ComputeDurationMs_returns_elapsed_milliseconds_when_completed()
    {
        DateTime started = new(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime completed = started.AddMilliseconds(1500.4);

        long? duration = StageTimelineSummary.ComputeDurationMs(started, completed);

        duration.Should().Be(1500);
    }

    [Fact]
    public void ComputeDurationMs_returns_null_when_not_completed()
    {
        DateTime started = new(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);

        long? duration = StageTimelineSummary.ComputeDurationMs(started, null);

        duration.Should().BeNull();
    }

    [Fact]
    public void FromRow_populates_duration_from_timestamps()
    {
        DateTime started = new(2026, 6, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime completed = started.AddSeconds(2);

        StageTimelineSummary summary = StageTimelineSummary.FromRow(
            "findings",
            started,
            completed,
            "succeeded");

        summary.StageName.Should().Be("findings");
        summary.OutcomeStatus.Should().Be("succeeded");
        summary.DurationMs.Should().Be(2000);
    }
}
