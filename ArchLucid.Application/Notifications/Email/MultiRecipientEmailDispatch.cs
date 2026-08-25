using ArchLucid.Core.Notifications;
using ArchLucid.Core.Notifications.Email;

namespace ArchLucid.Application.Notifications.Email;

/// <summary>
///     Sends templated email to multiple mailboxes with per-recipient ledger idempotency so partial
///     send failures can retry only the remaining recipients.
/// </summary>
internal static class MultiRecipientEmailDispatch
{
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

        foreach (string mailbox in normalizedMailboxes)
        {
            string mailboxIdempotencyKey = idempotencyKeyPrefix + ":" + mailbox;
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
}
