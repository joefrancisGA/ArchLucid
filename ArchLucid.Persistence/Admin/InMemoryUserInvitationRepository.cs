using System.Collections.Concurrent;

using ArchLucid.Core.Admin;

namespace ArchLucid.Persistence.Admin;

public sealed class InMemoryUserInvitationRepository : IUserInvitationRepository
{
    private readonly ConcurrentDictionary<Guid, UserInvitationRecord> _byId = new();

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
        _ = tokenHash;
        _ = cancellationToken;

        DateTimeOffset createdUtc = expiresUtc.AddDays(-14);
        UserInvitationRecord row = new()
        {
            Id = Guid.NewGuid(),
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
}
