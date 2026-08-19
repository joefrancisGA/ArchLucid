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

        string storageKey = BuildStorageKey(key);

        if (!_activeExternalKeys.TryGetValue(storageKey, out Guid identityId))
        {
            return Task.FromResult<AuthenticationIdentityRecord?>(null);
        }

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? record) || record.DisabledUtc is not null)
        {
            return Task.FromResult<AuthenticationIdentityRecord?>(null);
        }

        return Task.FromResult<AuthenticationIdentityRecord?>(record);
    }

    public Task<AuthenticationIdentityRecord?> FindAnyByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(key);

        string storageKey = BuildStorageKey(key);

        AuthenticationIdentityRecord? active = _byId.Values
            .Where(row => string.Equals(BuildStorageKey(new ExternalIdentityKey
            {
                ProviderType = row.ProviderType,
                NormalizedIssuer = row.NormalizedIssuer,
                Subject = row.Subject,
                TenantId = row.TenantId,
                TenantIdentityProviderId = row.TenantIdentityProviderId
            }), storageKey, StringComparison.Ordinal))
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
            TenantIdentityProviderId = insert.TenantIdentityProviderId
        };

        string storageKey = BuildStorageKey(key);

        if (_activeExternalKeys.ContainsKey(storageKey))
        {
            throw new DuplicateAuthenticationIdentityException(key);
        }

        AuthenticationIdentityRecord row = new()
        {
            Id = insert.Id != Guid.Empty ? insert.Id : Guid.NewGuid(),
            UserId = insert.UserId,
            ProviderType = insert.ProviderType,
            NormalizedIssuer = insert.NormalizedIssuer,
            Subject = insert.Subject,
            NormalizedEmail = insert.NormalizedEmail,
            DisplayEmail = insert.DisplayEmail,
            EmailVerified = insert.EmailVerified,
            TenantId = insert.TenantId,
            TenantIdentityProviderId = insert.TenantIdentityProviderId,
            CreatedUtc = TimeProvider.System.GetUtcNow()
        };

        _byId[row.Id] = row;
        _activeExternalKeys[storageKey] = row.Id;

        return Task.FromResult(row);
    }

    public Task DisableAsync(Guid identityId, DateTimeOffset disabledUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? existing))
        {
            return Task.CompletedTask;
        }

        AuthenticationIdentityRecord updated = new()
        {
            Id = existing.Id,
            UserId = existing.UserId,
            ProviderType = existing.ProviderType,
            NormalizedIssuer = existing.NormalizedIssuer,
            Subject = existing.Subject,
            NormalizedEmail = existing.NormalizedEmail,
            DisplayEmail = existing.DisplayEmail,
            EmailVerified = existing.EmailVerified,
            TenantId = existing.TenantId,
            TenantIdentityProviderId = existing.TenantIdentityProviderId,
            CreatedUtc = existing.CreatedUtc,
            LastAuthenticatedUtc = existing.LastAuthenticatedUtc,
            DisabledUtc = disabledUtc
        };

        _byId[identityId] = updated;

        string storageKey = BuildStorageKey(new ExternalIdentityKey
        {
            ProviderType = existing.ProviderType,
            NormalizedIssuer = existing.NormalizedIssuer,
            Subject = existing.Subject,
            TenantId = existing.TenantId,
            TenantIdentityProviderId = existing.TenantIdentityProviderId
        });

        _activeExternalKeys.TryRemove(storageKey, out _);

        return Task.CompletedTask;
    }

    public Task<bool> ReEnableAsync(Guid identityId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? existing) || existing.DisabledUtc is null)
        {
            return Task.FromResult(false);
        }

        AuthenticationIdentityRecord updated = new()
        {
            Id = existing.Id,
            UserId = existing.UserId,
            ProviderType = existing.ProviderType,
            NormalizedIssuer = existing.NormalizedIssuer,
            Subject = existing.Subject,
            NormalizedEmail = existing.NormalizedEmail,
            DisplayEmail = existing.DisplayEmail,
            EmailVerified = existing.EmailVerified,
            TenantId = existing.TenantId,
            TenantIdentityProviderId = existing.TenantIdentityProviderId,
            CreatedUtc = existing.CreatedUtc,
            LastAuthenticatedUtc = existing.LastAuthenticatedUtc,
            DisabledUtc = null
        };

        _byId[identityId] = updated;

        string storageKey = BuildStorageKey(new ExternalIdentityKey
        {
            ProviderType = existing.ProviderType,
            NormalizedIssuer = existing.NormalizedIssuer,
            Subject = existing.Subject,
            TenantId = existing.TenantId,
            TenantIdentityProviderId = existing.TenantIdentityProviderId
        });

        _activeExternalKeys[storageKey] = identityId;

        return Task.FromResult(true);
    }

    public Task RecordAuthenticationAsync(
        Guid identityId,
        DateTimeOffset authenticatedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(identityId, out AuthenticationIdentityRecord? existing))
        {
            return Task.CompletedTask;
        }

        AuthenticationIdentityRecord updated = new()
        {
            Id = existing.Id,
            UserId = existing.UserId,
            ProviderType = existing.ProviderType,
            NormalizedIssuer = existing.NormalizedIssuer,
            Subject = existing.Subject,
            NormalizedEmail = existing.NormalizedEmail,
            DisplayEmail = existing.DisplayEmail,
            EmailVerified = existing.EmailVerified,
            TenantId = existing.TenantId,
            TenantIdentityProviderId = existing.TenantIdentityProviderId,
            CreatedUtc = existing.CreatedUtc,
            LastAuthenticatedUtc = authenticatedUtc,
            DisabledUtc = existing.DisabledUtc
        };

        _byId[identityId] = updated;

        return Task.CompletedTask;
    }

    public Task<bool> HasActiveIdentityAsync(Guid userId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        bool hasActive = _byId.Values.Any(row => row.UserId == userId && row.DisabledUtc is null);

        return Task.FromResult(hasActive);
    }

    private static string BuildStorageKey(ExternalIdentityKey key) =>
        $"{AuthenticationProviderTypeMapper.ToStorageString(key.ProviderType)}|{key.NormalizedIssuer}|{key.Subject}|{AuthenticationProviderTypeMapper.BuildIdentityScopeKey(key.TenantId, key.TenantIdentityProviderId)}";
}
