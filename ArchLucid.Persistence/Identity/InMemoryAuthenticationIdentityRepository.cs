using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryAuthenticationIdentityRepository : IAuthenticationIdentityRepository
{
    private readonly ConcurrentDictionary<Guid, AuthenticationIdentityRecord> _byId = new();

    private readonly ConcurrentDictionary<string, Guid> _activeExternalKeys = new(StringComparer.Ordinal);

    public Task<AuthenticationIdentityRecord?> FindByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(key);

        string storageKey = AuthenticationIdentityRepositoryCore.BuildStorageKey(key);

        if (!_activeExternalKeys.TryGetValue(storageKey, out Guid identityId))
            return Task.FromResult<AuthenticationIdentityRecord?>(null);

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? record) || record.DisabledUtc is not null)
            return Task.FromResult<AuthenticationIdentityRecord?>(null);

        return Task.FromResult<AuthenticationIdentityRecord?>(record);
    }

    public Task<AuthenticationIdentityRecord?> FindAnyByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(key);

        string storageKey = AuthenticationIdentityRepositoryCore.BuildStorageKey(key);

        AuthenticationIdentityRecord? active = _byId.Values
            .Where(row => string.Equals(
                AuthenticationIdentityRepositoryCore.BuildStorageKey(AuthenticationIdentityRepositoryCore.ToExternalKey(row)),
                storageKey,
                StringComparison.Ordinal))
            .OrderBy(row => row.DisabledUtc is null ? 0 : 1)
            .ThenByDescending(row => row.CreatedUtc)
            .FirstOrDefault();

        return Task.FromResult(active);
    }

    public Task<AuthenticationIdentityRecord?> GetByIdAsync(Guid identityId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byId.TryGetValue(identityId, out AuthenticationIdentityRecord? record);

        return Task.FromResult(record);
    }

    public Task<IReadOnlyList<AuthenticationIdentityRecord>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        IReadOnlyList<AuthenticationIdentityRecord> rows =
            _byId.Values.Where(row => row.UserId == userId).OrderBy(row => row.CreatedUtc).ToList();

        return Task.FromResult(rows);
    }

    public Task<AuthenticationIdentityRecord> InsertAsync(
        AuthenticationIdentityInsert insert,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(insert);

        ExternalIdentityKey key = new()
        {
            ProviderType = insert.ProviderType,
            NormalizedIssuer = insert.NormalizedIssuer,
            Subject = insert.Subject,
            TenantId = insert.TenantId,
            TenantIdentityProviderId = insert.TenantIdentityProviderId,
        };

        string storageKey = AuthenticationIdentityRepositoryCore.BuildStorageKey(key);

        AuthenticationIdentityRecord row = AuthenticationIdentityRepositoryCore.CreateFromInsert(
            insert,
            TimeProvider.System.GetUtcNow());

        if (!_activeExternalKeys.TryAdd(storageKey, row.Id))
            throw new DuplicateAuthenticationIdentityException(key);

        _byId[row.Id] = row;

        return Task.FromResult(row);
    }

    public Task DisableAsync(Guid identityId, DateTimeOffset disabledUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? existing))
            return Task.CompletedTask;

        AuthenticationIdentityRecord updated = AuthenticationIdentityRepositoryCore.WithDisabled(existing, disabledUtc);

        _byId[identityId] = updated;

        string storageKey = AuthenticationIdentityRepositoryCore.BuildStorageKey(
            AuthenticationIdentityRepositoryCore.ToExternalKey(existing));

        _activeExternalKeys.TryRemove(storageKey, out _);

        return Task.CompletedTask;
    }

    public Task<bool> ReEnableAsync(Guid identityId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? existing) || existing.DisabledUtc is null)
            return Task.FromResult(false);

        string storageKey = AuthenticationIdentityRepositoryCore.BuildStorageKey(
            AuthenticationIdentityRepositoryCore.ToExternalKey(existing));

        if (_activeExternalKeys.TryGetValue(storageKey, out Guid occupantId) && occupantId != identityId)
            return Task.FromResult(false);

        if (!_activeExternalKeys.TryAdd(storageKey, identityId))
            return Task.FromResult(false);

        AuthenticationIdentityRecord updated = AuthenticationIdentityRepositoryCore.WithReEnabled(existing);

        _byId[identityId] = updated;

        return Task.FromResult(true);
    }

    public Task RecordAuthenticationAsync(
        Guid identityId,
        DateTimeOffset authenticatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? existing))
            return Task.CompletedTask;

        _byId[identityId] = AuthenticationIdentityRepositoryCore.WithLastAuthenticated(existing, authenticatedUtc);

        return Task.CompletedTask;
    }

    public Task<bool> HasActiveIdentityAsync(Guid userId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        bool hasActive = _byId.Values.Any(row => row.UserId == userId && row.DisabledUtc is null);

        return Task.FromResult(hasActive);
    }
}
