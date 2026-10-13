namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Resolves whether shared-key (account key) data-plane access is possible for a storage account.
///     A null or absent <c>allowSharedKeyAccess</c> property uses the platform default (allowed).
/// </summary>
public static class AzureInventoryStorageSharedKeyAccessResolver
{
    public const string AllowSharedKeyAccessPropertyKey = "allowSharedKeyAccess";

    public static AzureInventoryStorageSharedKeyAccessState Resolve(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return AzureInventoryStorageSharedKeyAccessState.AllowedPlatformDefault;
        }

        if (!TryReadProperty(properties, out string? rawValue))
        {
            return AzureInventoryStorageSharedKeyAccessState.AllowedPlatformDefault;
        }

        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return AzureInventoryStorageSharedKeyAccessState.AllowedPlatformDefault;
        }

        if (rawValue.Equals("false", StringComparison.OrdinalIgnoreCase)
            || rawValue.Equals("disabled", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryStorageSharedKeyAccessState.Disabled;
        }

        if (rawValue.Equals("true", StringComparison.OrdinalIgnoreCase)
            || rawValue.Equals("enabled", StringComparison.OrdinalIgnoreCase))
        {
            return AzureInventoryStorageSharedKeyAccessState.Enabled;
        }

        return AzureInventoryStorageSharedKeyAccessState.AllowedPlatformDefault;
    }

    public static bool PermitsListKeysConversion(AzureInventoryStorageSharedKeyAccessState state) =>
        state is not AzureInventoryStorageSharedKeyAccessState.Disabled;

    private static bool TryReadProperty(IReadOnlyDictionary<string, string> properties, out string? value)
    {
        if (properties.TryGetValue(AllowSharedKeyAccessPropertyKey, out string? direct))
        {
            value = direct;
            return true;
        }

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (entry.Key.Equals(AllowSharedKeyAccessPropertyKey, StringComparison.OrdinalIgnoreCase))
            {
                value = entry.Value;
                return true;
            }
        }

        value = null;
        return false;
    }
}

public enum AzureInventoryStorageSharedKeyAccessState
{
    Disabled = 0,
    Enabled = 1,
    AllowedPlatformDefault = 2,
}
