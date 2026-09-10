using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>In-memory <see cref="IArchitectureInventoryBindingRepository" /> for tests and storage mode <c>InMemory</c>.</summary>
public sealed class InMemoryArchitectureInventoryBindingRepository : IArchitectureInventoryBindingRepository
{
    private readonly ConcurrentDictionary<Guid, ArchitectureInventoryBindingRecord> _byArchitectureId = new();

    public Task<ArchitectureInventoryBindingRecord?> TryGetByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_byArchitectureId.TryGetValue(architectureId, out ArchitectureInventoryBindingRecord? record))
            return Task.FromResult<ArchitectureInventoryBindingRecord?>(null);

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult<ArchitectureInventoryBindingRecord?>(null);
        }

        return Task.FromResult<ArchitectureInventoryBindingRecord?>(record);
    }

    public Task UpsertAsync(ArchitectureInventoryBindingRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        _byArchitectureId[record.ArchitectureId] = record;

        return Task.CompletedTask;
    }

    public Task<bool> TryDeleteByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_byArchitectureId.TryGetValue(architectureId, out ArchitectureInventoryBindingRecord? record))
            return Task.FromResult(false);

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(_byArchitectureId.TryRemove(architectureId, out _));
    }
}
