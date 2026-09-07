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
        declarationKey.Contains("public", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("blob", StringComparison.OrdinalIgnoreCase);

    private static bool IsTransportSecurityKey(string declarationKey) =>
        declarationKey.Contains("https", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("tls", StringComparison.OrdinalIgnoreCase)
        || (declarationKey.Contains("ssl", StringComparison.OrdinalIgnoreCase)
            && !declarationKey.Contains("storage", StringComparison.OrdinalIgnoreCase));

    private static bool IsEncryptionKey(string declarationKey) =>
        declarationKey.Contains("storageencrypted", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("storage_encrypted", StringComparison.OrdinalIgnoreCase);

    private static bool IsNetworkIsolationKey(string declarationKey) =>
        declarationKey.Contains("defaultaction", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("default_action", StringComparison.OrdinalIgnoreCase)
        || IsNetworkAclBlobKey(declarationKey);

    private static bool IsNetworkAclBlobKey(string declarationKey) =>
        declarationKey.Contains("networkacl", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("network_acl", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("networkrules", StringComparison.OrdinalIgnoreCase);

    private static bool IsWorkloadIsolationKey(string declarationKey) =>
        declarationKey.Contains("privileged", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("hostnetwork", StringComparison.OrdinalIgnoreCase)
        || declarationKey.Contains("host_network", StringComparison.OrdinalIgnoreCase);

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
