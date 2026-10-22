using System.Collections.Concurrent;

using ArchLucid.Core.Notifications;

namespace ArchLucid.Persistence.Notifications;

/// <summary>In-memory idempotency ledger for tests and storage-off mode.</summary>
public sealed class InMemorySentEmailLedger : ISentEmailLedger
{
    private readonly ConcurrentDictionary<string, byte> _keys = new(StringComparer.Ordinal);

    /// <inheritdoc />
    public Task<bool> IsRecordedAsync(Guid tenantId, string idempotencyKey, CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = cancellationToken;

        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return Task.FromResult(false);

        return Task.FromResult(_keys.ContainsKey(idempotencyKey.Trim()));
    }

    /// <inheritdoc />
    public Task<bool> TryRecordSentAsync(SentEmailLedgerEntry entry, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (string.IsNullOrWhiteSpace(entry.IdempotencyKey))
            return Task.FromResult(false);

        bool added = _keys.TryAdd(entry.IdempotencyKey.Trim(), 0);

        return Task.FromResult(added);
    }
}
