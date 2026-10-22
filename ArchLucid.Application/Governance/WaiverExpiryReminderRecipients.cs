using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Resolves who receives a TB-2193 waiver expiry reminder.
///     <para>
///         The row asked for "the exception owner and the governance approver", but
///         <see cref="RiskExceptionRecord" /> carries no approver field — the closest recorded accountable party is
///         <see cref="RiskExceptionRecord.CreatedByUserId" />, so that is used instead of inventing one. The reminder
///         is deliberately not fanned out to every workspace admin: a waiver is owned, not broadcast.
///     </para>
/// </summary>
public static class WaiverExpiryReminderRecipients
{
    public static IReadOnlyList<string> Resolve(RiskExceptionRecord waiver, string? tenantAdminFallbackEmail)
    {
        ArgumentNullException.ThrowIfNull(waiver);

        HashSet<string> mailboxes = new(StringComparer.OrdinalIgnoreCase);

        AddWhenMailbox(mailboxes, waiver.OwnerUserId);
        AddWhenMailbox(mailboxes, waiver.CreatedByUserId);

        // Owner ids are not guaranteed to be email addresses (directory subject ids are common), so fall back to the
        // tenant admin contact rather than dropping the reminder silently.
        if (mailboxes.Count == 0)
            AddWhenMailbox(mailboxes, tenantAdminFallbackEmail);

        return mailboxes.OrderBy(static mailbox => mailbox, StringComparer.OrdinalIgnoreCase).ToArray();
    }

    private static void AddWhenMailbox(HashSet<string> mailboxes, string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate))
            return;

        string trimmed = candidate.Trim();

        if (!trimmed.Contains('@', StringComparison.Ordinal))
            return;

        mailboxes.Add(trimmed);
    }
}
