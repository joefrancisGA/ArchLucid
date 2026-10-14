namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Interprets collected ARM properties for public network access (book Ch. 6–7, four-reality drift).
/// </summary>
public static class AzureInventoryPublicNetworkAccessResolver
{
    public static bool IsPublicNetworkAccessEnabled(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return false;
        }

        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (string.IsNullOrWhiteSpace(entry.Key) || string.IsNullOrWhiteSpace(entry.Value))
            {
                continue;
            }

            if (entry.Key.Contains("enablePublicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && entry.Value.Equals("true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            if (entry.Key.Contains("publicNetworkAccess", StringComparison.OrdinalIgnoreCase)
                && IsPublicNetworkAccessValueEnabled(entry.Value))
            {
                return true;
            }
        }

        return false;
    }

    public static bool HasPrivateEndpointConnectionEvidence(IReadOnlyDictionary<string, string>? properties)
    {
        if (properties is null || properties.Count == 0)
        {
            return false;
        }

        return properties.Keys.Any(key =>
            key.Contains("privateEndpointConnections", StringComparison.OrdinalIgnoreCase));
    }

    public static bool IsPrivateEndpointOnlyExposure(IReadOnlyDictionary<string, string>? properties)
    {
        if (!HasPrivateEndpointConnectionEvidence(properties))
        {
            return false;
        }

        return !IsPublicNetworkAccessEnabled(properties);
    }

    private static bool IsPublicNetworkAccessValueEnabled(string value)
    {
        string normalized = value.Trim();

        if (normalized.Equals("Disabled", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("false", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return normalized.Equals("Enabled", StringComparison.OrdinalIgnoreCase)
            || normalized.Equals("true", StringComparison.OrdinalIgnoreCase);
    }
}
