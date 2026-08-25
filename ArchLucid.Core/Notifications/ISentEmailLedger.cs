namespace ArchLucid.Core.Notifications;

/// <summary>
///     Fail-closed idempotency: returns <see langword="false" /> when <paramref name="entry" />.IdempotencyKey
///     already exists.
/// </summary>
public interface ISentEmailLedger
{
    Task<bool> IsRecordedAsync(Guid tenantId, string idempotencyKey, CancellationToken cancellationToken);

    Task<bool> TryRecordSentAsync(SentEmailLedgerEntry entry, CancellationToken cancellationToken);
}
