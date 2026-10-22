using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Advisory;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// One poll iteration: load due advisory schedules and invoke <see cref="IAdvisoryScanRunner"/> for each (sequential, no in-iteration parallelism).
/// </summary>
/// <remarks>
/// Extracted from <see cref="AdvisoryScanHostedService"/> for unit tests (failure isolation, cancellation, ordering) without spinning the full background loop.
/// </remarks>
public sealed class AdvisoryDueScheduleProcessor(
    IAdvisoryScanScheduleRepository scheduleRepository,
    IAdvisoryScanRunner runner,
    ILogger<AdvisoryDueScheduleProcessor> logger)
{
    /// <summary>
    /// Loads up to <paramref name="maxSchedules"/> due rows and runs each; per-schedule errors are logged and counted except <see cref="OperationCanceledException"/>.
    /// </summary>
    public async Task<AdvisoryDueScheduleProcessResult> ProcessDueAsync(DateTime utcNow, int maxSchedules, CancellationToken ct)
    {
        IReadOnlyList<AdvisoryScanSchedule> due = await scheduleRepository
                .ListDueAsync(utcNow, maxSchedules, ct)
            ;

        int successCount = 0;
        int failureCount = 0;

        foreach (AdvisoryScanSchedule schedule in due)

            try
            {
                await runner.RunScheduleAsync(schedule, ct);
                successCount++;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                failureCount++;
                logger.LogError(
                    ex,
                    "Advisory scan failed for schedule {ScheduleId}. FailureCount={FailureCount} SuccessCount={SuccessCount}",
                    schedule.ScheduleId,
                    failureCount,
                    successCount);
            }

        return new AdvisoryDueScheduleProcessResult
        {
            SuccessCount = successCount, FailureCount = failureCount
        };
    }
}
