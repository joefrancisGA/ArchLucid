using ArchLucid.Core.Identity;
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
        IReadOnlyList<string> mailboxes,
        ISentEmailLedger sentEmailLedger,
        IEmailProvider emailProvider,
        Func<string, EmailMessage> buildMessage,
        Action<Exception, string>? logSendFailure,
        CancellationToken cancellationToken)
    {
        bool recordedAny = false;
        bool skippedAllAsAlreadyRecorded = true;
        List<string> distinctMailboxes = DistinctValidNormalizedMailboxes(normalizedMailboxes);

        if (distinctMailboxes.Count == 0)
            return false;

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

            skippedAllAsAlreadyRecorded = false;
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

        if (skippedAllAsAlreadyRecorded && distinctMailboxes.Count > 0)
            return true;

        return recordedAny;
    }

    private static List<string> DistinctValidNormalizedMailboxes(IReadOnlyList<string> mailboxes)
    {
        List<string> distinct = [];
        HashSet<string> seen = new(StringComparer.OrdinalIgnoreCase);

        foreach (string mailbox in mailboxes)
        {
            if (!IdentityEmailNormalizer.TryNormalize(mailbox, out string normalizedMailbox, out _))
                continue;

            if (!seen.Add(normalizedMailbox))
                continue;

            distinct.Add(normalizedMailbox);
        }

        return distinct;
    }
}
