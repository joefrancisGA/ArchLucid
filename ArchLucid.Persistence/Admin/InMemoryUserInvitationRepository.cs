using System.Collections.Concurrent;

using ArchLucid.Core.Admin;

namespace ArchLucid.Persistence.Admin;

public sealed class InMemoryUserInvitationRepository : IUserInvitationRepository
{
    private readonly ConcurrentDictionary<Guid, UserInvitationRecord> _byId = new();

    private readonly ConcurrentDictionary<Guid, byte[]> _tokenHashesByInvitationId = new();

    public Task<UserInvitationRecord?> GetPendingByEmailAsync(
        Guid tenantId,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        UserInvitationRecord? found = _byId.Values.FirstOrDefault(row =>
            row.TenantId == tenantId
            && row.Status == UserInvitationStatus.Pending
            && row.ExpiresUtc > TimeProvider.System.GetUtcNow()
            && string.Equals(row.Email, normalizedEmail, StringComparison.Ordinal));

        return Task.FromResult(found);
    }

    public Task<UserInvitationRecord?> GetByIdAsync(Guid tenantId, Guid invitationId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        return Task.FromResult(
            _byId.TryGetValue(invitationId, out UserInvitationRecord? row) && row.TenantId == tenantId ? row : null);
    }

    public Task<UserInvitationRecord?> GetPendingByIdAsync(Guid invitationId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        if (!_byId.TryGetValue(invitationId, out UserInvitationRecord? row))
        {
            return Task.FromResult<UserInvitationRecord?>(null);
        }

        if (row.Status != UserInvitationStatus.Pending || row.ExpiresUtc <= now)
        {
            return Task.FromResult<UserInvitationRecord?>(null);
        }

        return Task.FromResult<UserInvitationRecord?>(row);
    }

    public Task<IReadOnlyList<UserInvitationRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        List<UserInvitationRecord> rows = _byId.Values
            .Where(row => row.TenantId == tenantId)
            .OrderByDescending(row => row.CreatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<UserInvitationRecord>>(rows);
    }

    public Task<UserInvitationRecord> InsertAsync(
        Guid tenantId,
        Guid workspaceId,
        string normalizedEmail,
        string appRole,
        string invitedByActorId,
        string? message,
        byte[] tokenHash,
        DateTimeOffset expiresUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        Guid id = Guid.NewGuid();
        DateTimeOffset createdUtc = expiresUtc.AddDays(-14);
        UserInvitationRecord row = new()
        {
            Id = id,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            Email = normalizedEmail,
            AppRole = appRole,
            InvitedByActorId = invitedByActorId,
            Message = message,
            Status = UserInvitationStatus.Pending,
            CreatedUtc = createdUtc,
            ExpiresUtc = expiresUtc
        };

        _byId[row.Id] = row;
        _tokenHashesByInvitationId[id] = tokenHash;

        return Task.FromResult(row);
    }

    public Task<bool> RevokeAsync(
        Guid tenantId,
        Guid invitationId,
        DateTimeOffset revokedUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(invitationId, out UserInvitationRecord? row) || row.TenantId != tenantId)
        {
            return Task.FromResult(false);
        }

        if (row.Status != UserInvitationStatus.Pending)
        {
            return Task.FromResult(false);
        }

        UserInvitationRecord revoked = new()
        {
            Id = row.Id,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            Email = row.Email,
            AppRole = row.AppRole,
            InvitedByActorId = row.InvitedByActorId,
            Message = row.Message,
            Status = UserInvitationStatus.Revoked,
            CreatedUtc = row.CreatedUtc,
            ExpiresUtc = row.ExpiresUtc,
            RevokedUtc = revokedUtc
        };

        _byId[invitationId] = revoked;

        return Task.FromResult(true);
    }

    public Task<UserInvitationRecord?> GetPendingByTokenHashAsync(byte[] tokenHash, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(tokenHash);

        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        foreach (KeyValuePair<Guid, byte[]> entry in _tokenHashesByInvitationId)
        {
            if (!CryptographicEquals(entry.Value, tokenHash))
            {
                continue;
            }

            if (!_byId.TryGetValue(entry.Key, out UserInvitationRecord? row))
            {
                continue;
            }

            if (row.Status != UserInvitationStatus.Pending || row.ExpiresUtc <= now)
            {
                continue;
            }

            return Task.FromResult<UserInvitationRecord?>(row);
        }

        return Task.FromResult<UserInvitationRecord?>(null);
    }

    public Task<UserInvitationRecord?> GetByTokenHashAsync(byte[] tokenHash, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        ArgumentNullException.ThrowIfNull(tokenHash);

        foreach (KeyValuePair<Guid, byte[]> entry in _tokenHashesByInvitationId)
        {
            if (!CryptographicEquals(entry.Value, tokenHash))
            {
                continue;
            }

            if (_byId.TryGetValue(entry.Key, out UserInvitationRecord? row))
            {
                return Task.FromResult<UserInvitationRecord?>(row);
            }
        }

        return Task.FromResult<UserInvitationRecord?>(null);
    }

    public Task<IReadOnlyList<UserInvitationRecord>> ListPendingByNormalizedEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        DateTimeOffset now = TimeProvider.System.GetUtcNow();

        List<UserInvitationRecord> rows = _byId.Values
            .Where(row =>
                row.Status == UserInvitationStatus.Pending
                && row.ExpiresUtc > now
                && string.Equals(row.Email, normalizedEmail, StringComparison.Ordinal))
            .OrderByDescending(row => row.CreatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<UserInvitationRecord>>(rows);
    }

    public Task<bool> MarkAcceptedAsync(Guid invitationId, DateTimeOffset acceptedUtc, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(invitationId, out UserInvitationRecord? row))
        {
            return Task.FromResult(false);
        }

        if (row.Status != UserInvitationStatus.Pending)
        {
            return Task.FromResult(false);
        }

        UserInvitationRecord accepted = new()
        {
            Id = row.Id,
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            Email = row.Email,
            AppRole = row.AppRole,
            InvitedByActorId = row.InvitedByActorId,
            Message = row.Message,
            Status = UserInvitationStatus.Accepted,
            CreatedUtc = row.CreatedUtc,
            ExpiresUtc = row.ExpiresUtc,
            AcceptedUtc = acceptedUtc
        };

        _byId[invitationId] = accepted;

        return Task.FromResult(true);
    }

    private static bool CryptographicEquals(byte[] left, byte[] right)
    {
        if (left.Length != right.Length)
        {
            return false;
        }

        int diff = 0;

        for (int index = 0; index < left.Length; index++)
        {
            diff |= left[index] ^ right[index];
        }

        return diff == 0;
    }
}
