using System.Text.Json;

using ArchLucid.Core.Findings;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Reads normalized security property values from inventory <c>resources.json</c> row properties.
/// </summary>
internal static class DeclarationInventorySecurityPropertyInventoryReader
{
    internal static bool TryReadInventoryValue(
        InventoryTopologyCloudProvider cloudProvider,
        JsonElement properties,
        string logicalName,
        out string? value)
    {
        foreach (string key in ResolveInventoryPropertyKeys(cloudProvider, logicalName))
        {
            if (TryReadProperty(properties, key, out string? candidate))
            {
                value = candidate;
                return true;
            }
        }

        value = null;
        return false;
    }

    internal static string ResolveSecurityTheme(string logicalName) =>
        logicalName switch
        {
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess
                or DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess => "data-protection",
            DeclarationSecurityPropertyLogicalNames.HttpsOnly
                or DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion
                or DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled => "transport-security",
            _ => "data-protection",
        };

    private static IReadOnlyList<string> ResolveInventoryPropertyKeys(
        InventoryTopologyCloudProvider cloudProvider,
        string logicalName)
    {
        if (cloudProvider is InventoryTopologyCloudProvider.Azure)
            return ResolveAzureInventoryPropertyKeys(logicalName);

        if (cloudProvider is InventoryTopologyCloudProvider.Aws)
            return ResolveAwsInventoryPropertyKeys(logicalName);

        return ResolveGcpInventoryPropertyKeys(logicalName);
    }

    private static IReadOnlyList<string> ResolveAzureInventoryPropertyKeys(string logicalName) =>
        logicalName switch
        {
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => ["publicNetworkAccess"],
            DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess => ["allowBlobPublicAccess"],
            DeclarationSecurityPropertyLogicalNames.HttpsOnly => ["httpsOnly", "supportsHttpsTrafficOnly"],
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion => ["minimalTlsVersion", "minimumTlsVersion"],
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled => ["sslEnforcementEnabled"],
            _ => [],
        };

    private static IReadOnlyList<string> ResolveAwsInventoryPropertyKeys(string logicalName) =>
        logicalName switch
        {
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => ["publiclyAccessible"],
            DeclarationSecurityPropertyLogicalNames.HttpsOnly => ["supportsHttpsOnly"],
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion => ["minimumTlsVersion"],
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled => ["storageEncrypted"],
            _ => [],
        };

    private static IReadOnlyList<string> ResolveGcpInventoryPropertyKeys(string logicalName) =>
        logicalName switch
        {
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => ["ipv4Enabled", "enablePublicAccess"],
            DeclarationSecurityPropertyLogicalNames.HttpsOnly => ["requireSsl"],
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion => ["sslMode"],
            _ => [],
        };

    private static bool TryReadProperty(JsonElement properties, string key, out string? value)
    {
        if (!properties.TryGetProperty(key, out JsonElement element))
        {
            value = null;
            return false;
        }

        value = JsonElementToNormalizedString(element);
        return !string.IsNullOrWhiteSpace(value);
    }

    private static string? JsonElementToNormalizedString(JsonElement element) =>
        element.ValueKind switch
        {
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            JsonValueKind.String => element.GetString()?.Trim(),
            JsonValueKind.Number => element.GetRawText(),
            _ => null,
        };
}
