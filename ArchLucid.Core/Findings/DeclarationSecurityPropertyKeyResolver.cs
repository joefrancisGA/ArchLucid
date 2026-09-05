namespace ArchLucid.Core.Findings;

/// <summary>
///     Resolves declaration property bags across Terraform snake_case, compacted <c>tf.*</c> keys, and ARM camelCase aliases.
/// </summary>
public static class DeclarationSecurityPropertyKeyResolver
{
    private static readonly Dictionary<string, string[]> LogicalNameToCandidateKeys =
        new(StringComparer.Ordinal)
        {
            [DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess] =
            [
                "tf.public_network_access",
                "tf.publicnetworkaccess",
                "publicNetworkAccess",
            ],
            [DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess] =
            [
                "tf.allow_blob_public_access",
                "tf.allowblobpublicaccess",
                "allowBlobPublicAccess",
            ],
            [DeclarationSecurityPropertyLogicalNames.HttpsOnly] =
            [
                "tf.https_only",
                "tf.httpsonly",
                "httpsOnly",
                "tf.supports_https_traffic_only",
                "tf.supportshttpstrafficonly",
                "supportsHttpsTrafficOnly",
            ],
            [DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion] =
            [
                "tf.minimum_tls_version",
                "tf.minimumtlsversion",
                "minimumTlsVersion",
                "tf.min_tls_version",
                "minTlsVersion",
            ],
            [DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled] =
            [
                "tf.ssl_enforcement_enabled",
                "tf.sslenforcementenabled",
                "sslEnforcementEnabled",
            ],
            [DeclarationSecurityPropertyLogicalNames.IngressBlob] =
            [
                "tf.ingress",
                "tf.network_rules",
                "tf.networkrules",
                "tf.networkacls",
                "tf.ipsecurityrestrictions",
                "tf.ip_security_restrictions",
            ],
        };

    public static bool TryGet(
        IReadOnlyDictionary<string, string> properties,
        string logicalName,
        out string? canonicalKey,
        out string? value)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (string.IsNullOrWhiteSpace(logicalName))
        {
            canonicalKey = null;
            value = null;

            return false;
        }

        if (!LogicalNameToCandidateKeys.TryGetValue(logicalName, out string[]? candidates))
        {
            canonicalKey = null;
            value = null;

            return false;
        }

        foreach (string candidate in candidates)
        {
            if (TryGetDirect(properties, candidate, out string? directValue))
            {
                canonicalKey = candidate;
                value = directValue;

                return true;
            }
        }

        canonicalKey = null;
        value = null;

        return false;
    }

    private static bool TryGetDirect(
        IReadOnlyDictionary<string, string> properties,
        string key,
        out string? value)
    {
        foreach (KeyValuePair<string, string> entry in properties)
        {
            if (!string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase))
                continue;

            if (string.IsNullOrWhiteSpace(entry.Value))
                continue;

            value = entry.Value.Trim();

            return true;
        }

        value = null;

        return false;
    }
}
