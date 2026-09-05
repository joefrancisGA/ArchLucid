using System.Collections.Concurrent;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>In-memory <see cref="IArchitectureIdentityRepository" /> for tests and storage mode <c>InMemory</c>.</summary>
public sealed partial class InMemoryArchitectureIdentityRepository : IArchitectureIdentityRepository
{
    private readonly ConcurrentDictionary<Guid, ArchitectureIdentityRecord> _byId = new();

    public Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        string displayName,
        string? currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);
        _ = cancellationToken;

        string normalizedDisplayName = ArchitectureIdentityDisplayNameDefaults.Resolve(displayName);
        Guid architectureId = Guid.NewGuid();
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        ArchitectureIdentityRecord record = new()
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            DisplayName = normalizedDisplayName,
            CurrentModelId = currentModelId,
            CreatedUtc = nowUtc,
            UpdatedUtc = nowUtc,
        };

        if (!_byId.TryAdd(architectureId, record))
            throw new InvalidOperationException($"Architecture identity id '{architectureId:D}' already exists.");

        return Task.FromResult(record);
    }

    public Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        if (record.TenantId != scope.TenantId ||
            record.WorkspaceId != scope.WorkspaceId ||
            record.ScopeProjectId != scope.ProjectId)
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

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
        _ = cancellationToken;

        ArchitectureIdentityRecord record = RequireScopedRecord(scope, architectureId);

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
        _ = cancellationToken;

        ArchitectureIdentityRecord record = RequireScopedRecord(scope, architectureId);

        record.LatestSealedManifestId = manifestId;
        record.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        return Task.CompletedTask;
    }

    private ArchitectureIdentityRecord RequireScopedRecord(ScopeContext scope, Guid architectureId)
    {
        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            throw new InvalidOperationException($"Architecture identity id '{architectureId:D}' was not found.");

        if (record.TenantId != scope.TenantId ||
            record.WorkspaceId != scope.WorkspaceId ||
            record.ScopeProjectId != scope.ProjectId)
            throw new InvalidOperationException(
                $"Architecture identity id '{architectureId:D}' is outside the active scope.");

        return record;
    }
}
