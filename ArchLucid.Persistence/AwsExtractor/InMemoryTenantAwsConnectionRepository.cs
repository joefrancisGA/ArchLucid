using System.Collections.Concurrent;

using ArchLucid.Core.AwsExtractor;

namespace ArchLucid.Persistence.AwsExtractor;

public sealed class InMemoryTenantAwsConnectionRepository : ITenantAwsConnectionRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, Guid ConnectionId), TenantAwsConnectionRecord> _byConnection =
        new();

    private readonly ConcurrentDictionary<(Guid TenantId, string AccountId), Guid> _connectionIdByAccount =
        new();

    private readonly Lock _sync = new();

    public Task<TenantAwsConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _byConnection.TryGetValue((tenantId, connectionId), out TenantAwsConnectionRecord? record);

        return Task.FromResult(record);
    }

    public Task<TenantAwsConnectionRecord?> TryGetByAccountAsync(
        Guid tenantId,
        string accountId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_sync)
        {
            if (!_connectionIdByAccount.TryGetValue((tenantId, accountId.Trim()), out Guid connectionId))
                return Task.FromResult<TenantAwsConnectionRecord?>(null);

            _byConnection.TryGetValue((tenantId, connectionId), out TenantAwsConnectionRecord? record);

            return Task.FromResult(record);
        }
    }

    public Task UpsertAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        string accountId = record.AccountId.Trim();
        var accountKey = (record.TenantId, accountId);

        lock (_sync)
        {
            TenantAwsConnectionRecord? existing = null;
            if (_connectionIdByAccount.TryGetValue(accountKey, out Guid existingId))
                _byConnection.TryGetValue((record.TenantId, existingId), out existing);

            Guid connectionId = existing?.ConnectionId
                ?? (record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId);
            var connectionKey = (record.TenantId, connectionId);
            if (existing is null && _byConnection.ContainsKey(connectionKey))
                throw new InvalidOperationException($"AWS connection '{connectionId}' already belongs to another account.");

            DateTimeOffset now = TimeProvider.System.GetUtcNow();
            TenantAwsConnectionRecord stored = new()
            {
                ConnectionId = connectionId,
                TenantId = record.TenantId,
                AccountId = accountId,
                Region = record.Region.Trim(),
                RoleArn = record.RoleArn.Trim(),
                Status = record.Status,
                LastPolledUtc = record.LastPolledUtc,
                CreatedUtc = existing?.CreatedUtc ?? (record.CreatedUtc == default ? now : record.CreatedUtc),
                UpdatedUtc = now,
                UpdatedByActorId = record.UpdatedByActorId
            };

            _byConnection[connectionKey] = stored;
            _connectionIdByAccount[accountKey] = connectionId;
        }

        return Task.CompletedTask;
    }

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        AwsConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_sync)
        {
            if (!_byConnection.TryGetValue((tenantId, connectionId), out TenantAwsConnectionRecord? existing)
                || existing is null)
            {
                return Task.CompletedTask;
            }

            TenantAwsConnectionRecord updated = new()
            {
                ConnectionId = existing.ConnectionId,
                TenantId = existing.TenantId,
                AccountId = existing.AccountId,
                Region = existing.Region,
                RoleArn = existing.RoleArn,
                Status = status,
                LastPolledUtc = lastPolledUtc ?? existing.LastPolledUtc,
                CreatedUtc = existing.CreatedUtc,
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
                UpdatedByActorId = updatedByActorId
            };

            _byConnection[(tenantId, connectionId)] = updated;
        }

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_sync)
        {
            if (_byConnection.TryRemove((tenantId, connectionId), out TenantAwsConnectionRecord? removed)
                && removed is not null)
            {
                _connectionIdByAccount.TryRemove((tenantId, removed.AccountId), out _);
            }
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<TenantAwsConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<TenantAwsConnectionRecord> records = _byConnection.Values
            .Where(record => record.TenantId == tenantId)
            .OrderByDescending(record => record.UpdatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<TenantAwsConnectionRecord>>(records);
    }

    public Task<IReadOnlyList<TenantAwsConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<TenantAwsConnectionRecord> records = _byConnection.Values
            .Where(record => record.Status != AwsConnectionStatus.Disconnected)
            .OrderByDescending(record => record.UpdatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<TenantAwsConnectionRecord>>(records);
    }
}
