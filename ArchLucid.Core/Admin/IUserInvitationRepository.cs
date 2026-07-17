namespace ArchLucid.Core.Admin;

public interface IUserInvitationRepository
{
    Task<UserInvitationRecord?> GetPendingByEmailAsync(
        Guid tenantId,
        string normalizedEmail,
        CancellationToken cancellationToken);

    Task<UserInvitationRecord?> GetByIdAsync(Guid tenantId, Guid invitationId, CancellationToken cancellationToken);

    Task<UserInvitationRecord?> GetPendingByIdAsync(Guid invitationId, CancellationToken cancellationToken);

    Task<IReadOnlyList<UserInvitationRecord>> ListByTenantAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<UserInvitationRecord> InsertAsync(
        Guid tenantId,
        Guid workspaceId,
        string normalizedEmail,
        string appRole,
        string invitedByActorId,
        string? message,
        byte[] tokenHash,
        DateTimeOffset expiresUtc,
        CancellationToken cancellationToken);

    Task<bool> RevokeAsync(Guid tenantId, Guid invitationId, DateTimeOffset revokedUtc, CancellationToken cancellationToken);

    Task<UserInvitationRecord?> GetPendingByTokenHashAsync(byte[] tokenHash, CancellationToken cancellationToken);

    Task<UserInvitationRecord?> GetByTokenHashAsync(byte[] tokenHash, CancellationToken cancellationToken);

    Task<IReadOnlyList<UserInvitationRecord>> ListPendingByNormalizedEmailAsync(
        string normalizedEmail,
        CancellationToken cancellationToken);

    Task<bool> MarkAcceptedAsync(Guid invitationId, DateTimeOffset acceptedUtc, CancellationToken cancellationToken);
}
