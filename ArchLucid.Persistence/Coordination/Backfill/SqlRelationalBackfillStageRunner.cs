using System.Diagnostics;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>Records per-stage timing and delta counts on <see cref="SqlRelationalBackfillReport" /> (TB-090).</summary>
internal static class SqlRelationalBackfillStageRunner
{
    public static async Task RunTrackedStageAsync(
        string stageName,
        SqlRelationalBackfillReport report,
        Func<Task> stage,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(stageName);
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(stage);

        int processedBefore = report.ProcessedCount;
        int successBefore = report.SuccessCount;
        int failureBefore = report.FailureCount;

        Stopwatch stopwatch = Stopwatch.StartNew();

        await stage().ConfigureAwait(false);

        stopwatch.Stop();

        report.StageTimings.Add(
            new SqlRelationalBackfillStageTiming
            {
                Stage = stageName,
                ElapsedMilliseconds = stopwatch.ElapsedMilliseconds,
                ProcessedCount = report.ProcessedCount - processedBefore,
                SuccessCount = report.SuccessCount - successBefore,
                FailureCount = report.FailureCount - failureBefore,
            });
    }
}
