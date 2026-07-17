namespace ArchLucid.Core.Identity;

public interface IPlatformUserRepository
{
    Task<PlatformUserRecord?> GetByIdAsync(Guid userId, CancellationToken cancellationToken);

    Task<PlatformUserRecord> InsertAsync(PlatformUserInsert insert, CancellationToken cancellationToken);

    Task UpdateStatusAsync(Guid userId, PlatformUserStatus status, DateTimeOffset updatedUtc, CancellationToken cancellationToken);

    Task UpdatePrimaryEmailAsync(
        Guid userId,
        string primaryEmail,
        string normalizedPrimaryEmail,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken);

    Task RotateAuthVersionAsync(
        Guid userId,
        Guid authVersion,
        DateTimeOffset updatedUtc,
        CancellationToken cancellationToken);
}

public interface IAuthenticationIdentityRepository
{
    Task<AuthenticationIdentityRecord?> FindByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityRecord?> FindAnyByExternalKeyAsync(
        ExternalIdentityKey key,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityRecord?> GetByIdAsync(Guid identityId, CancellationToken cancellationToken);

    Task<IReadOnlyList<AuthenticationIdentityRecord>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityRecord> InsertAsync(
        AuthenticationIdentityInsert insert,
        CancellationToken cancellationToken);

    Task DisableAsync(Guid identityId, DateTimeOffset disabledUtc, CancellationToken cancellationToken);

    Task<bool> ReEnableAsync(Guid identityId, CancellationToken cancellationToken);

    Task RecordAuthenticationAsync(
        Guid identityId,
        DateTimeOffset authenticatedUtc,
        CancellationToken cancellationToken);

    Task<bool> HasActiveIdentityAsync(Guid userId, CancellationToken cancellationToken);
}

public interface IWorkspaceMembershipRepository
{
    Task<IReadOnlyList<WorkspaceMembershipRecord>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<WorkspaceMembershipRecord>> ListByUserAndTenantAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken);

    Task UpsertAsync(WorkspaceMembershipInsert insert, DateTimeOffset updatedUtc, CancellationToken cancellationToken);

    Task<int> CountActivePrivilegedMembersByTenantAsync(Guid tenantId, CancellationToken cancellationToken);
}

public interface IIdentityMigrationReviewRepository
{
    Task UpsertAsync(
        string legacySourceType,
        Guid legacySourceId,
        Guid? tenantId,
        IdentityMigrationReviewReason reasonCode,
        string reasonDetail,
        DateTimeOffset detectedUtc,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<IdentityMigrationReviewItemRecord>> ListUnresolvedAsync(CancellationToken cancellationToken);
}
