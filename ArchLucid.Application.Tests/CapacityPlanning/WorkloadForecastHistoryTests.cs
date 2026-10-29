using System.Text.Json;
using ArchLucid.Application.CapacityPlanning;
using FluentAssertions;

namespace ArchLucid.Application.Tests.CapacityPlanning;

[Trait("Category", "Unit")]
public sealed class WorkloadForecastHistoryTests
{
    [Fact]
    public void History_reports_mean_errors_and_latest_release()
    {
        var entries = new[]
        {
            new WorkloadForecastHistory.Observation(1, "a", "review", "cpu", "seconds", 10, 8,
                new DateTimeOffset(2026,1,1,0,0,0,TimeSpan.Zero)),
            new WorkloadForecastHistory.Observation(1, "b", "review", "cpu", "seconds", 12, 10,
                new DateTimeOffset(2026,2,1,0,0,0,TimeSpan.Zero))
        };
        var parsed = WorkloadForecastHistory.Import(JsonSerializer.Serialize(entries));
        var series = WorkloadForecastHistory.Summarize(parsed).Single();
        series.Observations.Should().Be(2);
        series.MeanAbsoluteError.Should().Be(2m);
        series.MeanAbsolutePercentageError.Should().Be(22.5m);
        series.LatestAbsolutePercentageError.Should().Be(20m);
    }

    [Fact]
    public void Zero_actual_remains_undefined_for_percentage()
    {
        var entries = new[]
        {
            new WorkloadForecastHistory.Observation(1, "a", "review", "memory", "GiB", 5, 0,
                new DateTimeOffset(2026,1,1,0,0,0,TimeSpan.Zero))
        };
        WorkloadForecastHistory.Summarize(entries).Single()
            .MeanAbsolutePercentageError.Should().BeNull();
    }

    [Fact]
    public void Invalid_revision_or_oversized_history_is_rejected()
    {
        Action invalid = () => WorkloadForecastHistory.Import("""[{"schemaVersion":2}]""");
        invalid.Should().Throw<ArgumentException>();
        Action oversized = () => WorkloadForecastHistory.Import(new string('x', 1000001));
        oversized.Should().Throw<ArgumentOutOfRangeException>();
    }
}
