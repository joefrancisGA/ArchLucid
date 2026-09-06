using System.Collections.Concurrent;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

/// <summary>In-memory <see cref="IArchitectureIdentityRepository" /> for tests and storage mode <c>InMemory</c>.</summary>
public sealed class InMemoryArchitectureIdentityRepository : IArchitectureIdentityRepository
{
    private const int MaxListTake = 200;

    private readonly ConcurrentDictionary<Guid, ArchitectureIdentityRecord> _byId = new();

    public Task<ArchitectureIdentityRecord> CreateAsync(
        ScopeContext scope,
        ArchitectureIdentityCreateArgs createArgs,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(createArgs);
        _ = cancellationToken;

        if (string.IsNullOrWhiteSpace(createArgs.DisplayName))
            throw new ArgumentException("DisplayName is required.", nameof(createArgs));

        Guid architectureId = Guid.NewGuid();
        DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

        ArchitectureIdentityRecord record = new()
        {
            ArchitectureId = architectureId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            DisplayName = createArgs.DisplayName.Trim(),
            Description = string.IsNullOrWhiteSpace(createArgs.Description) ? null : createArgs.Description.Trim(),
            CurrentModelId = createArgs.CurrentModelId,
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
        _ = cancellationToken;

        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        if (!MatchesScope(scope, record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        return Task.FromResult<ArchitectureIdentityRecord?>(Clone(record));
    }

    public Task<ArchitectureIdentityListResult> ListAsync(
        ScopeContext scope,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        int effectiveSkip = Math.Max(0, skip);
        int effectiveTake = Math.Clamp(take, 1, MaxListTake);

        List<ArchitectureIdentityRecord> scoped = _byId.Values
            .Where(record => MatchesScope(scope, record))
            .OrderByDescending(record => record.UpdatedUtc)
            .ToList();

        List<ArchitectureIdentityListItem> page = scoped
            .Skip(effectiveSkip)
            .Take(effectiveTake)
            .Select(record => new ArchitectureIdentityListItem
            {
                ArchitectureId = record.ArchitectureId,
                DisplayName = record.DisplayName,
                Description = record.Description,
                UpdatedUtc = record.UpdatedUtc,
                LatestSealedManifestId = record.LatestSealedManifestId,
                ChildPointers = new ArchitectureIdentityChildPointers(),
            })
            .ToList();

        return Task.FromResult(new ArchitectureIdentityListResult
        {
            Items = page,
            TotalCount = scoped.Count,
        });
    }

    public Task<ArchitectureIdentityWithChildren?> GetWithChildrenAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult<ArchitectureIdentityWithChildren?>(null);

        if (!MatchesScope(scope, record))
            return Task.FromResult<ArchitectureIdentityWithChildren?>(null);

        return Task.FromResult<ArchitectureIdentityWithChildren?>(new ArchitectureIdentityWithChildren
        {
            Identity = Clone(record),
            Reviews = Array.Empty<ArchitectureIdentityReviewChildSummary>(),
        });
    }

    public Task<ArchitectureIdentityRecord?> UpdateDisplayNameAsync(
        ScopeContext scope,
        Guid architectureId,
        string displayName,
        string? description,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        _ = cancellationToken;

        if (string.IsNullOrWhiteSpace(displayName))
            throw new ArgumentException("DisplayName is required.", nameof(displayName));

        if (!_byId.TryGetValue(architectureId, out ArchitectureIdentityRecord? record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        if (!MatchesScope(scope, record))
            return Task.FromResult<ArchitectureIdentityRecord?>(null);

        record.DisplayName = displayName.Trim();
        record.Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        record.UpdatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

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

        if (!MatchesScope(scope, record))
            throw new InvalidOperationException(
                $"Architecture identity id '{architectureId:D}' is outside the active scope.");

        return record;
    }

    private static bool MatchesScope(ScopeContext scope, ArchitectureIdentityRecord record) =>
        record.TenantId == scope.TenantId
        && record.WorkspaceId == scope.WorkspaceId
        && record.ScopeProjectId == scope.ProjectId;

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
        };
}
