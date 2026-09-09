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
            ContainsAffirmativeRoleToken(normalized, token));
    }

    public static bool IsReadOnlyRole(string? roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return false;
        }

        string normalized = roleName.Trim();

        return ReadOnlyRoleTokens.Any(token =>
            ContainsAffirmativeRoleToken(normalized, token));
    }

    private static bool ContainsAffirmativeRoleToken(string roleName, string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        int index = 0;

        while (index < roleName.Length)
        {
            index = roleName.IndexOf(token, index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
            {
                return false;
            }

            if (!IsNonPrefixedRoleToken(roleName, index))
            {
                return true;
            }

            index++;
        }

        return false;
    }

    private static bool IsNonPrefixedRoleToken(string roleName, int tokenIndex)
    {
        ReadOnlySpan<char> before = roleName.AsSpan(0, tokenIndex).TrimEnd();

        if (before.Length < 3)
        {
            return false;
        }

        return before.EndsWith("non", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non-", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non_", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non.", StringComparison.OrdinalIgnoreCase)
            || before.EndsWith("non ", StringComparison.OrdinalIgnoreCase);
    }
}
