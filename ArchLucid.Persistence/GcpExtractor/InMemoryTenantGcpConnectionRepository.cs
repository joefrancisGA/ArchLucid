using System.Collections.Concurrent;

using ArchLucid.Core.GcpExtractor;

namespace ArchLucid.Persistence.GcpExtractor;

public sealed class InMemoryTenantGcpConnectionRepository : ITenantGcpConnectionRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, Guid ConnectionId), TenantGcpConnectionRecord> _byConnection =
        new();

    private readonly ConcurrentDictionary<(Guid TenantId, string ProjectId), Guid> _connectionIdByProject =
        new();

    public Task<TenantGcpConnectionRecord?> TryGetAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        _byConnection.TryGetValue((tenantId, connectionId), out TenantGcpConnectionRecord? record);

        return Task.FromResult(record);
    }

    public Task<TenantGcpConnectionRecord?> TryGetByProjectAsync(
        Guid tenantId,
        string projectId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_connectionIdByProject.TryGetValue((tenantId, projectId.Trim()), out Guid connectionId))
            return Task.FromResult<TenantGcpConnectionRecord?>(null);

        _byConnection.TryGetValue((tenantId, connectionId), out TenantGcpConnectionRecord? record);

        return Task.FromResult(record);
    }

    public Task UpsertAsync(TenantGcpConnectionRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        Guid connectionId = record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId;
        string projectId = record.ProjectId.Trim();

        TenantGcpConnectionRecord stored = new()
        {
            ConnectionId = connectionId,
            TenantId = record.TenantId,
            ProjectId = projectId,
            WorkloadIdentityPoolProvider = record.WorkloadIdentityPoolProvider.Trim(),
            ServiceAccountEmail = record.ServiceAccountEmail.Trim(),
            Status = record.Status,
            LastPolledUtc = record.LastPolledUtc,
            CreatedUtc = record.CreatedUtc == default ? TimeProvider.System.GetUtcNow() : record.CreatedUtc,
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
            UpdatedByActorId = record.UpdatedByActorId
        };

        _byConnection[(record.TenantId, connectionId)] = stored;
        _connectionIdByProject[(record.TenantId, projectId)] = connectionId;

        return Task.CompletedTask;
    }

    public Task UpdateStatusAsync(
        Guid tenantId,
        Guid connectionId,
        GcpConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!_byConnection.TryGetValue((tenantId, connectionId), out TenantGcpConnectionRecord? existing)
            || existing is null)
        {
            return Task.CompletedTask;
        }

        TenantGcpConnectionRecord updated = new()
        {
            ConnectionId = existing.ConnectionId,
            TenantId = existing.TenantId,
            ProjectId = existing.ProjectId,
            WorkloadIdentityPoolProvider = existing.WorkloadIdentityPoolProvider,
            ServiceAccountEmail = existing.ServiceAccountEmail,
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

        if (_byConnection.TryRemove((tenantId, connectionId), out TenantGcpConnectionRecord? removed)
            && removed is not null)
        {
            _connectionIdByProject.TryRemove((tenantId, removed.ProjectId), out _);
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<TenantGcpConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<TenantGcpConnectionRecord> records = _byConnection.Values
            .Where(record => record.TenantId == tenantId)
            .OrderByDescending(record => record.UpdatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<TenantGcpConnectionRecord>>(records);
    }

    public Task<IReadOnlyList<TenantGcpConnectionRecord>> ListActiveConnectionsAsync(
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        List<TenantGcpConnectionRecord> records = _byConnection.Values
            .Where(record => record.Status != GcpConnectionStatus.Disconnected)
            .OrderByDescending(record => record.UpdatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<TenantGcpConnectionRecord>>(records);
    }
}
