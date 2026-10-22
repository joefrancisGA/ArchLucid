using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IRecurrenceCompletionRecipientResolver" />
public sealed class RecurrenceCompletionRecipientResolver(
    ISponsorReportRecipientLookup SponsorReportRecipientLookup) : IRecurrenceCompletionRecipientResolver
{
    private readonly ISponsorReportRecipientLookup _SponsorReportRecipientLookup =
        SponsorReportRecipientLookup ?? throw new ArgumentNullException(nameof(SponsorReportRecipientLookup));

    /// <inheritdoc />
    public async Task<IReadOnlyList<string>> ListRecipientMailboxesAsync(
        Guid tenantId,
        string scheduleCreatedByUserId,
        CancellationToken cancellationToken)
    {
        HashSet<string> mailboxes = new(StringComparer.OrdinalIgnoreCase);

        if (!string.IsNullOrWhiteSpace(scheduleCreatedByUserId) && scheduleCreatedByUserId.Contains('@', StringComparison.Ordinal))
            mailboxes.Add(scheduleCreatedByUserId.Trim());

        IReadOnlyList<string> admins = await _SponsorReportRecipientLookup
            .ListRecipientMailboxesAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        foreach (string mailbox in admins)
        {
            if (!string.IsNullOrWhiteSpace(mailbox))
                mailboxes.Add(mailbox.Trim());
        }

        return mailboxes.OrderBy(static m => m, StringComparer.OrdinalIgnoreCase).ToArray();
    }
}
