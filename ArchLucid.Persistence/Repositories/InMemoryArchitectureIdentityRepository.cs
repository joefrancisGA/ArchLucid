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
        cancellationToken.ThrowIfCancellationRequested();

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

        return Task.FromResult(Clone(record));
    }

    public Task<ArchitectureIdentityRecord?> GetByIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        if (record.TenantId != scope.TenantId ||
            record.WorkspaceId != scope.WorkspaceId ||
            record.ScopeProjectId != scope.ProjectId)
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        return Task.FromResult<ArchitectureIdentityRecord?>(Clone(record));
    }

    public Task UpdateCurrentModelAsync(
        ScopeContext scope,
        Guid architectureId,
        string currentModelId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(currentModelId);
        cancellationToken.ThrowIfCancellationRequested();


        UpdateScopedRecord(scope, architectureId, null, record => record.CurrentModelId = currentModelId, throwOnMissing: true);
        return Task.CompletedTask;
    }

    public Task UpdateLatestSealedManifestAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid manifestId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();


        UpdateScopedRecord(scope, architectureId, null, record => record.LatestSealedManifestId = manifestId, throwOnMissing: true);
        return Task.CompletedTask;
    }

    public Task<bool> TryUpdateDisplayNameWhenUntitledAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);
        cancellationToken.ThrowIfCancellationRequested();

        string normalizedDisplayName = ArchitectureIdentityDisplayNameDefaults.Resolve(displayName);
        if (string.Equals(normalizedDisplayName, ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture,
                StringComparison.Ordinal))
            return Task.FromResult(false);

        // The precondition and replacement must be one atomic compare/exchange.
        // Multiple concurrent backfill calls must not both claim the untitled row.
        return Task.FromResult(UpdateScopedRecord(
            scope,
            architectureId,
            record => string.Equals(record.DisplayName,
                ArchitectureIdentityDisplayNameDefaults.UntitledArchitecture,
                StringComparison.Ordinal),
            record => record.DisplayName = normalizedDisplayName));
    }

    public Task<bool> TryPatchAsync(
        ScopeContext scope,
        Guid architectureId,
        bool updateDisplayName,
        string? displayName,
        bool updateDescription,
        string? description,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        if (!updateDisplayName && !updateDescription)
            return Task.FromResult(false);

        if (updateDisplayName)
            ArgumentException.ThrowIfNullOrWhiteSpace(displayName);

        return Task.FromResult(UpdateScopedRecord(
            scope,
            architectureId,
            null,
            record =>
            {
                if (updateDisplayName)
                    record.DisplayName = displayName!;
                if (updateDescription)
                    record.Description = description;
            }));
    }

    public Task<bool> TrySetArchivedAsync(
        ScopeContext scope,
        Guid architectureId,
        bool archived,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
        return Task.FromResult(UpdateScopedRecord(
            scope, architectureId, null, record => record.ArchivedUtc = archived ? nowUtc : null));
    }

    public Task<int> CountArchivedInScopeAsync(
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        cancellationToken.ThrowIfCancellationRequested();

        int count = _byId.Values.Count(record =>
            record.TenantId == scope.TenantId
            && record.WorkspaceId == scope.WorkspaceId
            && record.ScopeProjectId == scope.ProjectId
            && record.ArchivedUtc.HasValue);

        return Task.FromResult(count);
    }

    // Never expose the mutable dictionary value to callers: a changed scope or
    // RestrictToShares on that object would otherwise bypass repository mutation APIs.
    private static ArchitectureIdentityRecord Clone(ArchitectureIdentityRecord record) =>
        new()
        {
            ArchitectureId = record.ArchitectureId,
            TenantId = record.TenantId,
            WorkspaceId = record.WorkspaceId,
            ScopeProjectId = record.ScopeProjectId,
            DisplayName = record.DisplayName,
            Description = record.Description,
            CurrentModelId = record.CurrentModelId,
            LatestSealedManifestId = record.LatestSealedManifestId,
            CreatedUtc = record.CreatedUtc,
            UpdatedUtc = record.UpdatedUtc,
            ArchivedUtc = record.ArchivedUtc,
            RestrictToShares = record.RestrictToShares,
        };

    /// <summary>
    /// Atomically replaces a scoped row. Stored dictionary records are never mutated after
    /// publication, so reads and list enumeration see consistent field snapshots.
    /// This matches SQL's conditional UPDATE semantics for the untitled transition.
    /// </summary>
    private bool UpdateScopedRecord(
        ScopeContext scope,
        Guid architectureId,
        Func<ArchitectureIdentityRecord, bool>? precondition,
        Action<ArchitectureIdentityRecord> mutate,
        bool throwOnMissing = false)
    {
        while (true)
        {
            if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? current))
            {
                if (throwOnMissing)
                    throw new InvalidOperationException($"Architecture identity id '{architectureId:D}' was not found.");
                return false;
            }

            if (current.TenantId != scope.TenantId ||
                current.WorkspaceId != scope.WorkspaceId ||
                current.ScopeProjectId != scope.ProjectId)
            {
                if (throwOnMissing)
                    throw new InvalidOperationException(
                        $"Architecture identity id '{architectureId:D}' is outside the active scope.");
                return false;
            }

            if (precondition is not null && !precondition(current))
                return false;

            ArchitectureIdentityRecord replacement = Clone(current);
            mutate(replacement);
            replacement.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

            if (_byId.TryUpdate(architectureId, replacement, current))
                return true;
        }
    }
}
