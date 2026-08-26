namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Writes <c>tf.*</c> declaration properties and dual-writes ARM camelCase aliases for security keys classifiers read.
/// </summary>
internal static class InfrastructureDeclarationSecurityPropertyWriter
{
    private static readonly Dictionary<string, string> SanitizedTfKeyToArmAlias =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["publicnetworkaccess"] = "publicNetworkAccess",
            ["allowblobpublicaccess"] = "allowBlobPublicAccess",
            ["httpsonly"] = "httpsOnly",
            ["minimumtlsversion"] = "minimumTlsVersion",
            ["min_tls_version"] = "minTlsVersion",
            ["supportshttpstrafficonly"] = "supportsHttpsTrafficOnly",
        };

    internal static bool TryAddTfPropertyWithArmAlias(
        Dictionary<string, string> properties,
        string rawKey,
        string rawValue)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!CanonicalInfrastructurePropertyBag.TryAddTfProperty(properties, rawKey, rawValue))
            return false;

        if (CanonicalInfrastructurePropertyBag.ShouldRedactKey(rawKey))
            return true;

        string sanitizedKey = CanonicalInfrastructurePropertyBag.SanitizePropertyKey(rawKey).ToLowerInvariant();

        if (!SanitizedTfKeyToArmAlias.TryGetValue(sanitizedKey, out string? armAlias))
            return true;

        string tfKey = $"tf.{sanitizedKey}";

        if (!properties.TryGetValue(tfKey, out string? tfValue) || string.IsNullOrWhiteSpace(tfValue))
            return true;

        properties[armAlias] = tfValue;

        return true;
    }
}
