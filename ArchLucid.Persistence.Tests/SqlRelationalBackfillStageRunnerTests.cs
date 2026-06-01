using ArchLucid.Persistence.Coordination.Backfill;

using Xunit;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class SqlRelationalBackfillStageRunnerTests
{
    [Fact]
    public async Task RunTrackedStageAsync_records_elapsed_and_delta_counts()
    {
        SqlRelationalBackfillReport report = new();

        await SqlRelationalBackfillStageRunner.RunTrackedStageAsync(
            "TestStage",
            report,
            () =>
            {
                report.ProcessedCount += 2;
                report.SuccessCount += 1;
                report.FailureCount += 1;
                return Task.CompletedTask;
            },
            CancellationToken.None);

        SqlRelationalBackfillStageTiming timing = Assert.Single(report.StageTimings);
        Assert.Equal("TestStage", timing.Stage);
        Assert.True(timing.ElapsedMilliseconds >= 0);
        Assert.Equal(2, timing.ProcessedCount);
        Assert.Equal(1, timing.SuccessCount);
        Assert.Equal(1, timing.FailureCount);
    }
}
