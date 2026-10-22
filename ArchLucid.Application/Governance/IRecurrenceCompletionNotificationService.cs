using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>Post-success recurrence re-engagement: delta, email, audit (TB-261).</summary>
public interface IRecurrenceCompletionNotificationService
{
    Task NotifyCompletionAsync(
        ArchitectureReviewRecurrenceSchedule schedule,
        Guid triggeredRunId,
        CancellationToken cancellationToken);
}
