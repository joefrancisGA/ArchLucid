namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Allow-listed cloud role names for identity blast-radius (DX-06). Unknown roles are skipped (R5 false-negative bias).
/// </summary>
public static class IdentityBlastRadiusRoleNames
{
    /// <summary>
    ///     Write/admin roles that imply datastore blast radius:
    ///     Contributor, Owner, Key Vault Secrets Officer, AmazonS3FullAccess, roles/secretmanager.admin.
    /// </summary>
    private static readonly string[] WriteAdminRoleTokens =
    [
        "Contributor",
        "Owner",
        "Key Vault Secrets Officer",
        "AmazonS3FullAccess",
        "roles/secretmanager.admin",
    ];

    private static readonly string[] ReadOnlyRoleTokens =
    [
        "Key Vault Secrets User",
        "Storage Blob Data Reader",
    ];

    public static bool IsWriteAdminRole(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return false;
        }

        string normalized = roleName.Trim();

        return WriteAdminRoleTokens.Any(token =>
            normalized.Contains(token, StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsReadOnlyRole(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return false;
        }

        string normalized = roleName.Trim();

        return ReadOnlyRoleTokens.Any(token =>
            normalized.Contains(token, StringComparison.OrdinalIgnoreCase));
    }
}
