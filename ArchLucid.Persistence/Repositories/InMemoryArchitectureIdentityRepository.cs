using System.Collections.Concurrent;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>In-memory architecture identity storage for integration tests without SQL.</summary>
public sealed class InMemoryArchitectureIdentityRepository : IArchitectureIdentityRepository
{
    private readonly ConcurrentDictionary<Guid, ArchitectureIdentityRecord> _records = new();

    public Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        string? currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        Guid architectureId = Guid.NewGuid();
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        ArchitectureIdentityRecord record = new()
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            CurrentModelId = currentModelId,
            CreatedUtc = nowUtc,
            UpdatedUtc = nowUtc,
        };

        _records[architectureId] = record;

        return Task.FromResult(record);
    }

    public Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_records.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult<ArchitectureIdentityRecord?>(null);
        }

        return Task.FromResult<ArchitectureIdentityRecord?>(record);
    }

    public Task UpdateCurrentModelAsync(
        ScopeContext scope,
        Guid architectureId,
        string currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(currentModelId);

        if (!_records.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.CompletedTask;

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.CompletedTask;
        }

        record.CurrentModelId = currentModelId;
        record.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.CompletedTask;
    }

    public Task UpdateLatestSealedManifestAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid manifestId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_records.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.CompletedTask;

        if (record.TenantId != scope.TenantId
            || record.WorkspaceId != scope.WorkspaceId
            || record.ScopeProjectId != scope.ProjectId)
        {
            return Task.CompletedTask;
        }

        record.LatestSealedManifestId = manifestId;
        record.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.CompletedTask;
    }
}
