using System.Collections.Concurrent;

using ArchLucid.Core.GcpExtractor;

namespace ArchLucid.Persistence.GcpExtractor;

public sealed class InMemoryTenantGcpConnectionRepository : ITenantGcpConnectionRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, Guid ConnectionId), TenantGcpConnectionRecord> _byConnection =
        new();

    private readonly ConcurrentDictionary<(Guid TenantId, string ProjectId), Guid> _connectionIdByProject =
        new();

    private readonly Lock _sync = new();

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

        lock (_sync)
        {
            if (!_connectionIdByProject.TryGetValue((tenantId, projectId.Trim()), out Guid connectionId))
                return Task.FromResult<TenantGcpConnectionRecord?>(null);

            _byConnection.TryGetValue((tenantId, connectionId), out TenantGcpConnectionRecord? record);

            return Task.FromResult(record);
        }
    }

    public Task UpsertAsync(TenantGcpConnectionRecord record, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        string projectId = record.ProjectId.Trim();
        var projectKey = (record.TenantId, projectId);

        lock (_sync)
        {
            TenantGcpConnectionRecord? existing = null;
            if (_connectionIdByProject.TryGetValue(projectKey, out Guid existingId))
                _byConnection.TryGetValue((record.TenantId, existingId), out existing);

            Guid connectionId = existing?.ConnectionId
                ?? (record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId);
            var connectionKey = (record.TenantId, connectionId);
            if (existing is null && _byConnection.ContainsKey(connectionKey))
                throw new InvalidOperationException($"GCP connection '{connectionId}' already belongs to another project.");

            DateTimeOffset now = TimeProvider.System.GetUtcNow();
            TenantGcpConnectionRecord stored = new()
            {
                ConnectionId = connectionId,
                TenantId = record.TenantId,
                ProjectId = projectId,
                WorkloadIdentityPoolProvider = record.WorkloadIdentityPoolProvider.Trim(),
                ServiceAccountEmail = record.ServiceAccountEmail.Trim(),
                Status = record.Status,
                LastPolledUtc = record.LastPolledUtc,
                CreatedUtc = existing?.CreatedUtc ?? (record.CreatedUtc == default ? now : record.CreatedUtc),
                UpdatedUtc = now,
                UpdatedByActorId = record.UpdatedByActorId
            };

            _byConnection[connectionKey] = stored;
            _connectionIdByProject[projectKey] = connectionId;
        }

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

        lock (_sync)
        {
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
        }

        return Task.CompletedTask;
    }

    public Task DeleteAsync(Guid tenantId, Guid connectionId, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        lock (_sync)
        {
            if (_byConnection.TryRemove((tenantId, connectionId), out TenantGcpConnectionRecord? removed)
                && removed is not null)
            {
                _connectionIdByProject.TryRemove((tenantId, removed.ProjectId), out _);
            }
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
