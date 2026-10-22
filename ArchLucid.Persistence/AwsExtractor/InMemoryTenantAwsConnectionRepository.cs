using System.Collections.Concurrent;

using ArchLucid.Core.AwsExtractor;

namespace ArchLucid.Persistence.AwsExtractor;

public sealed class InMemoryTenantAwsConnectionRepository : ITenantAwsConnectionRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, Guid ConnectionId), TenantAwsConnectionRecord> _byConnection =
        new();

    private readonly ConcurrentDictionary<(Guid TenantId, string AccountId), Guid> _connectionIdByAccount =
        new();

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

        if (!_connectionIdByAccount.TryGetValue((tenantId, accountId.Trim()), out Guid connectionId))
            return Task.FromResult<TenantAwsConnectionRecord?>(null);

        _byConnection.TryGetValue((tenantId, connectionId), out TenantAwsConnectionRecord? record);

        return Task.FromResult(record);
    }

    public Task UpsertAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        Guid connectionId = record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId;
        string accountId = record.AccountId.Trim();

        TenantAwsConnectionRecord stored = new()
        {
            ConnectionId = connectionId,
            TenantId = record.TenantId,
            AccountId = accountId,
            Region = record.Region.Trim(),
            RoleArn = record.RoleArn.Trim(),
            Status = record.Status,
            LastPolledUtc = record.LastPolledUtc,
            CreatedUtc = record.CreatedUtc == default ? TimeProvider.System.GetUtcNow() : record.CreatedUtc,
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
            UpdatedByActorId = record.UpdatedByActorId
        };

        _byConnection[(record.TenantId, connectionId)] = stored;
        _connectionIdByAccount[(record.TenantId, accountId)] = connectionId;

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

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (_byConnection.TryRemove((tenantId, connectionId), out TenantAwsConnectionRecord? removed)
            && removed is not null)
        {
            _connectionIdByAccount.TryRemove((tenantId, removed.AccountId), out _);
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
