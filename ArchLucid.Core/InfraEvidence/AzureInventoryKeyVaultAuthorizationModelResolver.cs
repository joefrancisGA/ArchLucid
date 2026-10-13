namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Key Vault control-to-data via access policies applies only when RBAC authorization is not enabled on the vault.
/// </summary>
public static class AzureInventoryKeyVaultAuthorizationModelResolver
{
    public const string EnableRbacAuthorizationPropertyKey = "enableRbacAuthorization";

    public static bool UsesAccessPolicyAuthorizationModel(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return true;
        }

        if (!TryReadProperty(properties, out string? rawValue))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return true;
        }

        return !rawValue.Equals("true", StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryReadProperty(IReadOnlyDictionary<string, string> properties, out string? value)
    {
        if (properties.TryGetValue(EnableRbacAuthorizationPropertyKey, out string? direct))
        {
            value = direct;
            return true;
        }

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (entry.Key.Equals(EnableRbacAuthorizationPropertyKey, StringComparison.OrdinalIgnoreCase))
            {
                value = entry.Value;
                return true;
            }
        }

        value = null;
        return false;
    }
}
