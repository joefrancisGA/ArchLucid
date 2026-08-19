using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

internal static class AuthenticationProviderTypeMapper
{
    internal static string ToStorageString(AuthenticationProviderType providerType) =>
        providerType switch
        {
            AuthenticationProviderType.EmailOneTimeCode => "EmailOneTimeCode",
            AuthenticationProviderType.MicrosoftIdentity => "MicrosoftIdentity",
            AuthenticationProviderType.GoogleIdentity => "GoogleIdentity",
            AuthenticationProviderType.TrialLocalPassword => "TrialLocalPassword",
            AuthenticationProviderType.TenantOidc => "TenantOidc",
            AuthenticationProviderType.TenantSaml => "TenantSaml",
            _ => throw new ArgumentOutOfRangeException(nameof(providerType), providerType, "Unknown provider type.")
        };

    internal static AuthenticationProviderType Parse(string value) =>
        value switch
        {
            "EmailOneTimeCode" => AuthenticationProviderType.EmailOneTimeCode,
            "MicrosoftIdentity" => AuthenticationProviderType.MicrosoftIdentity,
            "GoogleIdentity" => AuthenticationProviderType.GoogleIdentity,
            "TrialLocalPassword" => AuthenticationProviderType.TrialLocalPassword,
            "TenantOidc" => AuthenticationProviderType.TenantOidc,
            "TenantSaml" => AuthenticationProviderType.TenantSaml,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown provider type.")
        };

    internal static string PlatformUserStatusToStorage(PlatformUserStatus status) =>
        status switch
        {
            PlatformUserStatus.Active => "Active",
            PlatformUserStatus.Suspended => "Suspended",
            PlatformUserStatus.Disabled => "Disabled",
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown platform user status.")
        };

    internal static PlatformUserStatus ParsePlatformUserStatus(string value) =>
        value switch
        {
            "Active" => PlatformUserStatus.Active,
            "Suspended" => PlatformUserStatus.Suspended,
            "Disabled" => PlatformUserStatus.Disabled,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown platform user status.")
        };

    internal static string WorkspaceMembershipStatusToStorage(WorkspaceMembershipStatus status) =>
        status switch
        {
            WorkspaceMembershipStatus.Active => "Active",
            WorkspaceMembershipStatus.Suspended => "Suspended",
            WorkspaceMembershipStatus.Revoked => "Revoked",
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown workspace membership status.")
        };

    internal static WorkspaceMembershipStatus ParseWorkspaceMembershipStatus(string value) =>
        value switch
        {
            "Active" => WorkspaceMembershipStatus.Active,
            "Suspended" => WorkspaceMembershipStatus.Suspended,
            "Revoked" => WorkspaceMembershipStatus.Revoked,
            _ => throw new ArgumentOutOfRangeException(nameof(value), value, "Unknown workspace membership status.")
        };

    internal static string BuildIdentityScopeKey(Guid? tenantId, Guid? tenantIdentityProviderId) =>
        $"{tenantId?.ToString("D") ?? "00000000-0000-0000-0000-000000000000"}|{tenantIdentityProviderId?.ToString("D") ?? "00000000-0000-0000-0000-000000000000"}";
}
