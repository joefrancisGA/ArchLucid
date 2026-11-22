using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>In-memory <see cref="IArchitectureInventoryBindingRepository" /> for tests and storage mode <c>InMemory</c>.</summary>
public sealed class InMemoryArchitectureInventoryBindingRepository : IArchitectureInventoryBindingRepository
{
    // Match the full SQL binding key. Architecture IDs can be reused in distinct scopes.
    private readonly ConcurrentDictionary<
        (Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid ArchitectureId),
        ArchitectureInventoryBindingRecord> _byScopeAndArchitectureId = new();

    public Task<ArchitectureInventoryBindingRecord?> TryGetByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(
            _byScopeAndArchitectureId.TryGetValue(Key(scope, architectureId), out ArchitectureInventoryBindingRecord? record)
                ? Clone(record)
                : null);
    }

    public Task UpsertAsync(ArchitectureInventoryBindingRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);
        cancellationToken.ThrowIfCancellationRequested();

        _byScopeAndArchitectureId[Key(record)] = Clone(record);

        return Task.CompletedTask;
    }

    public Task<bool> TryDeleteByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(_byScopeAndArchitectureId.TryRemove(Key(scope, architectureId), out _));
    }

    private static (Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid ArchitectureId)
        Key(ScopeContext scope, Guid architectureId) =>
        (scope.TenantId, scope.WorkspaceId, scope.ProjectId, architectureId);

    private static (Guid TenantId, Guid WorkspaceId, Guid ProjectId, Guid ArchitectureId)
        Key(ArchitectureInventoryBindingRecord record) =>
        (record.TenantId, record.WorkspaceId, record.ScopeProjectId, record.ArchitectureId);

    private static ArchitectureInventoryBindingRecord Clone(ArchitectureInventoryBindingRecord record) =>
        new()
        {
            ArchitectureId = record.ArchitectureId,
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ScopeProjectId = record.ScopeProjectId,
            SnapshotId = record.SnapshotId,
            BoundBy = record.BoundBy,
            BoundUtc = record.BoundUtc,
            RowVersion = record.RowVersion?.ToArray(),
        };
}
