using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Host.Core.Hosted;

public sealed class ArchitectureReviewRecurrenceDueScheduleProcessor(
    IArchitectureReviewRecurrenceScheduleRepository scheduleRepository,
    IRecurringArchitectureReviewTriggerService triggerService,
    ILogger<ArchitectureReviewRecurrenceDueScheduleProcessor> logger)
{
    public async Task ProcessDueAsync(DateTime utcNow, int maxSchedules, CancellationToken cancellationToken)
    {
        IReadOnlyList<ArchitectureReviewRecurrenceSchedule> due =
            await scheduleRepository.ListDueAsync(utcNow, maxSchedules, cancellationToken);

        foreach (ArchitectureReviewRecurrenceSchedule schedule in due)

            try
            {
                await triggerService.TriggerScheduleAsync(schedule, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Recurring architecture review failed for schedule {ScheduleId}.", schedule.ScheduleId);
            }
    }
}
