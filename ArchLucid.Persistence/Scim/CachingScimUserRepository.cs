using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Persistence.Caching;

namespace ArchLucid.Persistence.Scim;

/// <summary>
///     Decorates <see cref="IScimUserRepository" /> for claims-transform lookups
///     (<see cref="IScimUserRepository.GetByExternalIdAsync" />).
/// </summary>
public sealed class CachingScimUserRepository(IScimUserRepository inner, IHotPathReadCache hotPathReadCache)
    : IScimUserRepository
{
    private readonly IHotPathReadCache _hotPathReadCache =
        hotPathReadCache ?? throw new ArgumentNullException(nameof(hotPathReadCache));

    private readonly IScimUserRepository _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<(IReadOnlyList<ScimUserRecord> items, int totalCount)> ListAsync(
        Guid tenantId,
        ScimFilterNode? filter,
        int startIndex1Based,
        int count,
        CancellationToken cancellationToken)
    {
        return _inner.ListAsync(tenantId, filter, startIndex1Based, count, cancellationToken);
    }

    /// <inheritdoc />
    public Task<ScimUserRecord?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.ScimUserById(tenantId, id),
            innerCt => _inner.GetByIdAsync(tenantId, id, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<ScimUserRecord?> GetByExternalIdAsync(
        Guid tenantId,
        string externalId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(externalId);

        return _hotPathReadCache.GetOrCreateAsync(
            HotPathCacheKeys.ScimUserByExternalId(tenantId, externalId),
            innerCt => _inner.GetByExternalIdAsync(tenantId, externalId, innerCt),
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task<ScimUserRecord> InsertAsync(
        Guid tenantId,
        string externalId,
        string userName,
        string? displayName,
        bool active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken)
    {
        ScimUserRecord created = await _inner.InsertAsync(
            tenantId,
            externalId,
            userName,
            displayName,
            active,
            resolvedRole,
            resolvedRoleOrigin,
            cancellationToken);

        await HotPathCacheEviction.RemoveScimUserAsync(
            _hotPathReadCache,
            tenantId,
            created.Id,
            created.ExternalId,
            cancellationToken);

        return created;
    }

    /// <inheritdoc />
    public async Task ReplaceAsync(
        Guid tenantId,
        Guid id,
        string externalId,
        string userName,
        string? displayName,
        bool active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken)
    {
        ScimUserRecord? prior = await _inner.GetByIdAsync(tenantId, id, cancellationToken);

        await _inner.ReplaceAsync(
            tenantId,
            id,
            externalId,
            userName,
            displayName,
            active,
            resolvedRole,
            resolvedRoleOrigin,
            cancellationToken);

        await HotPathCacheEviction.RemoveScimUserAsync(
            _hotPathReadCache,
            tenantId,
            id,
            prior?.ExternalId,
            cancellationToken);

        await HotPathCacheEviction.RemoveScimUserAsync(
            _hotPathReadCache,
            tenantId,
            id,
            externalId,
            cancellationToken);
    }

    /// <inheritdoc />
    public async Task PatchAsync(
        Guid tenantId,
        Guid id,
        string? externalId,
        string? userName,
        string? displayName,
        bool? active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken)
    {
        ScimUserRecord? prior = await _inner.GetByIdAsync(tenantId, id, cancellationToken);

        await _inner.PatchAsync(
            tenantId,
            id,
            externalId,
            userName,
            displayName,
            active,
            resolvedRole,
            resolvedRoleOrigin,
            cancellationToken);

        await HotPathCacheEviction.RemoveScimUserAsync(
            _hotPathReadCache,
            tenantId,
            id,
            prior?.ExternalId,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(externalId))
        {
            await HotPathCacheEviction.RemoveScimUserAsync(
                _hotPathReadCache,
                tenantId,
                id,
                externalId,
                cancellationToken);
        }
    }

    /// <inheritdoc />
    public async Task DeactivateAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        ScimUserRecord? prior = await _inner.GetByIdAsync(tenantId, id, cancellationToken);

        await _inner.DeactivateAsync(tenantId, id, cancellationToken);

        await HotPathCacheEviction.RemoveScimUserAsync(
            _hotPathReadCache,
            tenantId,
            id,
            prior?.ExternalId,
            cancellationToken);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<(string DisplayName, string ExternalId)>> ListGroupKeysForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        return _inner.ListGroupKeysForUserAsync(tenantId, userId, cancellationToken);
    }
}
