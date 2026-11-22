using System.Net.Mail;
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

        if (TryNormalizeMailbox(scheduleCreatedByUserId, out string? creatorMailbox))
            mailboxes.Add(creatorMailbox);

        IReadOnlyList<string> admins = await _SponsorReportRecipientLookup
            .ListRecipientMailboxesAsync(tenantId, cancellationToken)
            .ConfigureAwait(false);

        foreach (string mailbox in admins)
        {
            if (TryNormalizeMailbox(mailbox, out string? adminMailbox))
                mailboxes.Add(adminMailbox);
        }

        return mailboxes.OrderBy(static m => m, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static bool TryNormalizeMailbox(string? candidate, out string normalized)
    {
        normalized = string.Empty;
        if (string.IsNullOrWhiteSpace(candidate))
            return false;

        string trimmed = candidate.Trim();
        if (!MailAddress.TryCreate(trimmed, out MailAddress? parsed)
            || !string.Equals(parsed.Address, trimmed, StringComparison.Ordinal))
            return false;

        normalized = parsed.Address;
        return true;
    }
}
