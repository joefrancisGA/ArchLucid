using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

public interface IRecurringArchitectureReviewTriggerService
{
    Task TriggerScheduleAsync(ArchitectureReviewRecurrenceSchedule schedule, CancellationToken cancellationToken = default);
}
