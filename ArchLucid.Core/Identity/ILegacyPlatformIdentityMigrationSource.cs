namespace ArchLucid.Core.Identity;

public sealed class LegacyScimUserMigrationRow
{
    public Guid ScimUserId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public string ExternalId
    {
        get;
        init;
    } = string.Empty;

    public string UserName
    {
        get;
        init;
    } = string.Empty;

    public string? DisplayName
    {
        get;
        init;
    }

    public bool Active
    {
        get;
        init;
    }

    public string? ResolvedRole
    {
        get;
        init;
    }

    public Guid? PlatformUserId
    {
        get;
        init;
    }
}

public sealed class LegacyTrialIdentityMigrationRow
{
    public Guid IdentityUserId
    {
        get;
        init;
    }

    public string Email
    {
        get;
        init;
    } = string.Empty;

    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public bool EmailConfirmed
    {
        get;
        init;
    }

    public DateTimeOffset? EmailVerifiedUtc
    {
        get;
        init;
    }

    public string? LinkedEntraOid
    {
        get;
        init;
    }

    public Guid? PlatformUserId
    {
        get;
        init;
    }
}

public sealed class LegacyProjectRoleAssignmentMigrationRow
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid WorkspaceId
    {
        get;
        init;
    }

    public Guid ScimUserId
    {
        get;
        init;
    }

    public string Role
    {
        get;
        init;
    } = string.Empty;
}

public interface ILegacyPlatformIdentityMigrationSource
{
    Task<IReadOnlyList<LegacyScimUserMigrationRow>> ListScimUsersAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<LegacyTrialIdentityMigrationRow>> ListTrialIdentityUsersAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<LegacyProjectRoleAssignmentMigrationRow>> ListProjectRoleAssignmentsAsync(
        CancellationToken cancellationToken);

    Task<string?> TryGetEntraTenantIdAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<Guid?> TryGetDefaultWorkspaceIdAsync(Guid tenantId, CancellationToken cancellationToken);

    Task LinkScimUserAsync(Guid scimUserId, Guid platformUserId, CancellationToken cancellationToken);

    Task LinkTrialIdentityUserAsync(Guid identityUserId, Guid platformUserId, CancellationToken cancellationToken);
}
