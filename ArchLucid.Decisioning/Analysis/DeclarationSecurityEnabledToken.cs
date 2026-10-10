namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Public-network values from ARM ("Enabled") and Terraform bools ("true").
/// </summary>
internal static class DeclarationSecurityEnabledToken
{
    public static bool IsPublicNetworkEnabled(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        string normalized = value.Trim();

        if (string.Equals(normalized, "enabled", StringComparison.OrdinalIgnoreCase))
            return true;

        return string.Equals(normalized, "true", StringComparison.OrdinalIgnoreCase);
    }
}
