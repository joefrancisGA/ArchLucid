namespace ArchLucid.Application.Governance;

/// <summary>Resolves mailboxes for recurrence completion notifications (TB-261).</summary>
public interface IRecurrenceCompletionRecipientResolver
{
    Task<IReadOnlyList<string>> ListRecipientMailboxesAsync(
        Guid tenantId,
        string scheduleCreatedByUserId,
        CancellationToken cancellationToken);
}
