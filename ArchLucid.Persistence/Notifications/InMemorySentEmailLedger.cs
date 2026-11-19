using System.Collections.Concurrent;

using ArchLucid.Core.Notifications;

namespace ArchLucid.Persistence.Notifications;

/// <summary>In-memory idempotency ledger for tests and storage-off mode.</summary>
public sealed class InMemorySentEmailLedger : ISentEmailLedger
{
    private readonly ConcurrentDictionary<(Guid TenantId, string IdempotencyKey), byte> _keys = new();

    /// <inheritdoc />
    public Task<bool> IsRecordedAsync(Guid tenantId, string idempotencyKey, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(idempotencyKey))
            return Task.FromResult(false);

        return Task.FromResult(_keys.ContainsKey((tenantId, idempotencyKey.Trim())));
    }

    /// <inheritdoc />
    public Task<bool> TryRecordSentAsync(SentEmailLedgerEntry entry, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (string.IsNullOrWhiteSpace(entry.IdempotencyKey))
            return Task.FromResult(false);

        bool added = _keys.TryAdd((entry.TenantId, entry.IdempotencyKey.Trim()), 0);

        return Task.FromResult(added);
    }
}
