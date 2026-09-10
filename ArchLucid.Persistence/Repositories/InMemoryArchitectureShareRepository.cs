using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Repositories;

public sealed class InMemoryArchitectureShareRepository : IArchitectureShareRepository
{
    private readonly ConcurrentDictionary<Guid, bool> _restrictToSharesByArchitectureId = new();
    private readonly ConcurrentDictionary<(Guid ArchitectureId, Guid UserId), ArchitectureShareRecord> _shares = new();

    public Task<int> CountSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        int count = _shares.Values.Count(share =>
            share.ArchitectureId == architectureId
            && share.TenantId == scope.TenantId
            && share.WorkspaceId == scope.WorkspaceId
            && share.ScopeProjectId == scope.ProjectId);

        return Task.FromResult(count);
    }

    public Task<bool?> TryGetRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_restrictToSharesByArchitectureId.TryGetValue(architectureId, out bool value))
            return Task.FromResult<bool?>(null);

        return Task.FromResult<bool?>(value);
    }

    public Task<bool> TryEnableRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid actorUserId,
        string grantedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(grantedBy);

        int shareCount = _shares.Values.Count(share =>
            share.ArchitectureId == architectureId
            && share.TenantId == scope.TenantId
            && share.WorkspaceId == scope.WorkspaceId
            && share.ScopeProjectId == scope.ProjectId);

        if (shareCount == 0)
        {
            DateTime grantedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

            _shares[(architectureId, actorUserId)] = new ArchitectureShareRecord
            {
                ArchitectureId = architectureId,
                UserId = actorUserId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                Role = ArchitectureShareRoles.Admin,
                GrantedBy = grantedBy.Trim(),
                GrantedUtc = grantedUtc,
            };
        }

        _restrictToSharesByArchitectureId[architectureId] = true;

        return Task.FromResult(true);
    }

    public Task<bool> TryDisableRestrictToSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        _restrictToSharesByArchitectureId[architectureId] = false;

        return Task.FromResult(true);
    }

    public Task<string?> TryGetShareRoleAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (!_shares.TryGetValue((architectureId, userId), out ArchitectureShareRecord? share))
            return Task.FromResult<string?>(null);

        if (share.TenantId != scope.TenantId
            || share.WorkspaceId != scope.WorkspaceId
            || share.ScopeProjectId != scope.ProjectId)
        {
            return Task.FromResult<string?>(null);
        }

        return Task.FromResult<string?>(share.Role);
    }

    public void SeedArchitecture(Guid architectureId, bool restrictToShares = false) =>
        _restrictToSharesByArchitectureId[architectureId] = restrictToShares;

    public void SeedShare(ArchitectureShareRecord record) =>
        _shares[(record.ArchitectureId, record.UserId)] = record;

    public Task<IReadOnlyList<ArchitectureShareRecord>> ListSharesAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        List<ArchitectureShareRecord> rows = _shares.Values
            .Where(share =>
                share.ArchitectureId == architectureId
                && share.TenantId == scope.TenantId
                && share.WorkspaceId == scope.WorkspaceId
                && share.ScopeProjectId == scope.ProjectId)
            .OrderBy(share => share.GrantedUtc)
            .ThenBy(share => share.UserId)
            .ToList();

        return Task.FromResult<IReadOnlyList<ArchitectureShareRecord>>(rows);
    }

    public Task<bool> UpsertShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        string role,
        string grantedBy,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(role);
        ArgumentException.ThrowIfNullOrWhiteSpace(grantedBy);

        _shares[(architectureId, userId)] = new ArchitectureShareRecord
        {
            ArchitectureId = architectureId,
            UserId = userId,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ScopeProjectId = scope.ProjectId,
            Role = role.Trim(),
            GrantedBy = grantedBy.Trim(),
            GrantedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
        };

        return Task.FromResult(true);
    }

    public Task<bool> TryDeleteShareAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return Task.FromResult(_shares.TryRemove((architectureId, userId), out _));
    }

    public Task<int> CountRestrictedWithoutActorShareAsync(
        ScopeContext scope,
        Guid? actorUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        int count = _restrictToSharesByArchitectureId.Count(pair =>
        {
            if (!pair.Value)
                return false;

            if (actorUserId is not Guid userId || userId == Guid.Empty)
                return true;

            return !_shares.TryGetValue((pair.Key, userId), out ArchitectureShareRecord? share)
                   || share.TenantId != scope.TenantId
                   || share.WorkspaceId != scope.WorkspaceId
                   || share.ScopeProjectId != scope.ProjectId;
        });

        return Task.FromResult(count);
    }
}
