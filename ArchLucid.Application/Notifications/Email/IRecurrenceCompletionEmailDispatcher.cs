namespace ArchLucid.Application.Notifications.Email;

/// <summary>Sends recurrence completion notification email (TB-261).</summary>
public interface IRecurrenceCompletionEmailDispatcher
{
    Task<bool> TryDispatchAsync(
        Guid tenantId,
        Guid scheduleId,
        Guid triggeredRunId,
        string scheduleName,
        int newFindingCount,
        int resolvedFindingCount,
        Guid sourceRunId,
        IReadOnlyList<string> toMailboxes,
        CancellationToken cancellationToken);
}
