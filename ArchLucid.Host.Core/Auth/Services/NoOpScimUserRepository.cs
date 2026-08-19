using ArchLucid.Core.Scim;
using ArchLucid.Core.Scim.Filtering;
using ArchLucid.Core.Scim.Models;

namespace ArchLucid.Host.Core.Auth.Services;

/// <summary>
///     Default <see cref="IScimUserRepository" /> when SCIM storage is not registered: directory lookups miss so
///     bearer JWT roles remain authoritative.
/// </summary>
public sealed class NoOpScimUserRepository : IScimUserRepository
{
    private static readonly IReadOnlyList<ScimUserRecord> EmptyUsers = Array.Empty<ScimUserRecord>();

    private static readonly IReadOnlyList<(string DisplayName, string ExternalId)> EmptyGroups =
        Array.Empty<(string DisplayName, string ExternalId)>();

    /// <inheritdoc />
    public Task<(IReadOnlyList<ScimUserRecord> items, int totalCount)> ListAsync(
        Guid tenantId,
        ScimFilterNode? filter,
        int startIndex1Based,
        int count,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = filter;
        _ = startIndex1Based;
        _ = count;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult((EmptyUsers, 0));
    }

    /// <inheritdoc />
    public Task<ScimUserRecord?> GetByIdAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = id;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<ScimUserRecord?>(null);
    }

    /// <inheritdoc />
    public Task<ScimUserRecord?> GetByExternalIdAsync(
        Guid tenantId,
        string externalId,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = externalId;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<ScimUserRecord?>(null);
    }

    /// <inheritdoc />
    public Task<ScimUserRecord> InsertAsync(
        Guid tenantId,
        string externalId,
        string userName,
        string? displayName,
        bool active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("SCIM user storage is not configured.");

    /// <inheritdoc />
    public Task ReplaceAsync(
        Guid tenantId,
        Guid id,
        string externalId,
        string userName,
        string? displayName,
        bool active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("SCIM user storage is not configured.");

    /// <inheritdoc />
    public Task PatchAsync(
        Guid tenantId,
        Guid id,
        string? externalId,
        string? userName,
        string? displayName,
        bool? active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken) =>
        throw new NotSupportedException("SCIM user storage is not configured.");

    /// <inheritdoc />
    public Task DeactivateAsync(Guid tenantId, Guid id, CancellationToken cancellationToken) =>
        throw new NotSupportedException("SCIM user storage is not configured.");

    /// <inheritdoc />
    public Task<IReadOnlyList<(string DisplayName, string ExternalId)>> ListGroupKeysForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        _ = tenantId;
        _ = userId;
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(EmptyGroups);
    }
}
