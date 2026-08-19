namespace ArchLucid.Application.Notifications.Email;

/// <summary>Sends finding remediation assignment notification email (TB-2195).</summary>
public interface IFindingRemediationAssignmentEmailDispatcher
{
    Task<bool> TryDispatchAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        string findingTitle,
        string assigneeMailbox,
        DateTimeOffset? remediationDueUtc,
        CancellationToken cancellationToken);
}
