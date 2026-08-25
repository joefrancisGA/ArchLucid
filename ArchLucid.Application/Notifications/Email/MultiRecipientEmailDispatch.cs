using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>
///     Sends templated email to multiple mailboxes with per-recipient ledger idempotency so partial
///     send failures can retry only the remaining recipients.
/// </summary>
internal static class MultiRecipientEmailDispatch
{
    internal static string BuildMailboxIdempotencyKey(string idempotencyKeyPrefix, string mailbox) =>
        idempotencyKeyPrefix + ":" + mailbox.ToLowerInvariant();

    internal static async Task<bool> TrySendToMailboxesAsync(
        Guid tenantId,
        string idempotencyKeyPrefix,
        string templateId,
        IReadOnlyList<string> normalizedMailboxes,
        ISentEmailLedger sentEmailLedger,
        IEmailProvider emailProvider,
        Func<string, EmailMessage> buildMessage,
        Action<Exception, string>? logSendFailure,
        CancellationToken cancellationToken)
    {
        bool recordedAny = false;
        List<string> distinctMailboxes = DistinctMailboxesCaseInsensitive(normalizedMailboxes);

        foreach (string mailbox in distinctMailboxes)
        {
            string mailboxIdempotencyKey = BuildMailboxIdempotencyKey(idempotencyKeyPrefix, mailbox);
            SentEmailLedgerEntry ledgerEntry = new(
                mailboxIdempotencyKey,
                tenantId,
                templateId,
                emailProvider.ProviderName,
                null);

            if (await sentEmailLedger.IsRecordedAsync(tenantId, mailboxIdempotencyKey, cancellationToken).ConfigureAwait(false))
                continue;

            EmailMessage message = buildMessage(mailbox);

            try
            {
                await emailProvider.SendAsync(message, cancellationToken).ConfigureAwait(false);
            }
            catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
            {
                logSendFailure?.Invoke(ex, mailbox);
                throw;
            }

            if (await sentEmailLedger.TryRecordSentAsync(ledgerEntry, cancellationToken).ConfigureAwait(false))
                recordedAny = true;
        }

        return recordedAny;
    }

    private static List<string> DistinctMailboxesCaseInsensitive(IReadOnlyList<string> normalizedMailboxes)
    {
        List<string> distinct = [];
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);

        foreach (string mailbox in normalizedMailboxes)
        {
            if (!seen.Add(mailbox))
                continue;

            distinct.Add(mailbox);
        }

        return distinct;
    }
}
