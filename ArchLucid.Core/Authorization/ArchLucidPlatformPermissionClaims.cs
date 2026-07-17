namespace ArchLucid.Core.Authorization;

/// <summary>
///     Fine-grained <c>permission</c> claim values for hosted platform operators
///     (<see cref="ArchLucidRoles.PlatformOperator" />).
/// </summary>
public static class ArchLucidPlatformPermissionClaims
{
    /// <summary>Durable tenant offboarding (<see cref="ArchLucidPolicies.PlatformTenantDeletionAuthority" />).</summary>
    public const string TenantDelete = "platform:tenant-delete";

    /// <summary>Fleet-wide aggregates and internal cross-tenant analytics (<see cref="ArchLucidPolicies.PlatformCrossTenantReadAuthority" />).</summary>
    public const string CrossTenantRead = "platform:cross-tenant-read";

    /// <summary>Time-limited tenant SSO recovery grants (<see cref="ArchLucidPolicies.PlatformIdentityRecoveryAuthority" />).</summary>
    public const string IdentityRecovery = "platform:identity-recovery";
}
