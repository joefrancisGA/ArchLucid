namespace ArchLucid.Application.Analysis;

/// <summary>
///     Three-way pack×declaration×inventory gate: only mismatches where the declaration asserts the secure posture.
/// </summary>
public static class DeclarationInventoryContradictionThreeWayGate
{
    public static bool DeclarationClaimsSecureControl(DeclarationInventoryContradictionMismatch mismatch)
    {
        ArgumentNullException.ThrowIfNull(mismatch);

        string normalizedDeclaration = NormalizeSecurityToken(mismatch.DeclarationValue);
        string declarationKey = mismatch.DeclarationKey;

        if (IsPublicExposureKey(declarationKey))
        {
            return normalizedDeclaration is "false" or "disabled" or "deny";
        }

        if (IsTransportSecurityKey(declarationKey))
        {
            return normalizedDeclaration is "true" or "enabled";
        }

        if (IsEncryptionKey(declarationKey))
        {
            return normalizedDeclaration is "true" or "enabled";
        }

        if (IsNetworkIsolationKey(declarationKey))
        {
            if (normalizedDeclaration is "false" or "disabled" or "deny" or "restricted")
                return true;

            if (IsNetworkAclBlobKey(declarationKey)
                && normalizedDeclaration.Contains("defaultaction", StringComparison.Ordinal)
                && normalizedDeclaration.Contains("deny", StringComparison.Ordinal))
                return true;

            return false;
        }

        if (IsWorkloadIsolationKey(declarationKey))
        {
            return normalizedDeclaration is "false" or "disabled";
        }

        return false;
    }

    private static bool IsPublicExposureKey(string declarationKey) =>
        DeclarationKeyContainsSecurityToken(declarationKey, "public")
        || DeclarationKeyContainsSecurityToken(declarationKey, "blob");

    private static bool DeclarationKeyContainsSecurityToken(string declarationKey, string token)
    {
        if (string.IsNullOrEmpty(declarationKey) || string.IsNullOrEmpty(token))
            return false;

        for (int index = 0; index <= declarationKey.Length - token.Length; index++)
        {
            if (!declarationKey.AsSpan(index, token.Length).Equals(token, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!IsDeclarationKeySecurityTokenStart(declarationKey, index))
                continue;

            return true;
        }

        return false;
    }

    private static bool IsDeclarationKeySecurityTokenStart(string declarationKey, int tokenStartIndex)
    {
        if (tokenStartIndex == 0)
            return true;

        char previous = declarationKey[tokenStartIndex - 1];
        char current = declarationKey[tokenStartIndex];

        if (previous is '.' or '_' or '-')
            return true;

        if (char.IsAsciiLetterLower(previous) && char.IsAsciiLetterUpper(current))
            return true;

        return !char.IsAsciiLetter(previous);
    }

    private static bool IsTransportSecurityKey(string declarationKey) =>
        DeclarationKeyContainsSecurityToken(declarationKey, "https")
        || DeclarationKeyContainsSecurityToken(declarationKey, "tls")
        || (DeclarationKeyContainsSecurityToken(declarationKey, "ssl")
            && !declarationKey.Contains("storage", StringComparison.OrdinalIgnoreCase));

    private static bool IsEncryptionKey(string declarationKey) =>
        DeclarationKeyContainsSecurityToken(declarationKey, "storageencrypted")
        || DeclarationKeyContainsSecurityToken(declarationKey, "storage_encrypted");

    private static bool IsNetworkIsolationKey(string declarationKey) =>
        DeclarationKeyContainsSecurityToken(declarationKey, "defaultaction")
        || DeclarationKeyContainsSecurityToken(declarationKey, "default_action")
        || IsNetworkAclBlobKey(declarationKey);

    private static bool IsNetworkAclBlobKey(string declarationKey) =>
        DeclarationKeyContainsSecurityToken(declarationKey, "networkacl")
        || DeclarationKeyContainsSecurityToken(declarationKey, "network_acl")
        || DeclarationKeyContainsSecurityToken(declarationKey, "networkrules");

    private static bool IsWorkloadIsolationKey(string declarationKey) =>
        DeclarationKeyContainsSecurityToken(declarationKey, "privileged")
        || DeclarationKeyContainsSecurityToken(declarationKey, "hostnetwork")
        || DeclarationKeyContainsSecurityToken(declarationKey, "host_network");

    private static string NormalizeSecurityToken(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string trimmed = value.Trim();

        if (string.Equals(trimmed, "enabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "true", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "allow", StringComparison.OrdinalIgnoreCase))
            return "true";

        if (string.Equals(trimmed, "disabled", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "false", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "deny", StringComparison.OrdinalIgnoreCase))
            return "false";

        return trimmed.ToLowerInvariant();
    }
}
