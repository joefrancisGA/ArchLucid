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

    internal static bool TryResolveSecurityTheme(string logicalName, out string theme)
    {
        switch (logicalName)
        {
            case DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess:
            case DeclarationSecurityPropertyLogicalNames.AllowBlobPublicAccess:
                theme = "data-protection";
                return true;
            case DeclarationSecurityPropertyLogicalNames.HttpsOnly:
            case DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion:
            case DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled:
                theme = "transport-security";
                return true;
            case DeclarationSecurityPropertyLogicalNames.StorageEncrypted:
                theme = "encryption";
                return true;
            case DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction:
                theme = "network-isolation";
                return true;
            case DeclarationSecurityPropertyLogicalNames.K8sPrivileged:
            case DeclarationSecurityPropertyLogicalNames.K8sHostNetwork:
                theme = "workload-isolation";
                return true;
            default:
                theme = string.Empty;
                return false;
        }
    }

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
            DeclarationSecurityPropertyLogicalNames.StorageEncrypted => ["encryptionEnabled", "storageEncrypted"],
            DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction => ["defaultAction"],
            DeclarationSecurityPropertyLogicalNames.K8sPrivileged => ["privileged"],
            DeclarationSecurityPropertyLogicalNames.K8sHostNetwork => ["hostNetwork"],
            _ => [],
        };

    private static IReadOnlyList<string> ResolveAwsInventoryPropertyKeys(string logicalName) =>
        logicalName switch
        {
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => ["publiclyAccessible"],
            DeclarationSecurityPropertyLogicalNames.HttpsOnly => ["supportsHttpsOnly"],
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion => ["minimumTlsVersion"],
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled => ["sslEnforcementEnabled"],
            DeclarationSecurityPropertyLogicalNames.StorageEncrypted => ["storageEncrypted"],
            DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction => ["defaultAction"],
            DeclarationSecurityPropertyLogicalNames.K8sPrivileged => ["privileged"],
            DeclarationSecurityPropertyLogicalNames.K8sHostNetwork => ["hostNetwork"],
            _ => [],
        };

    private static IReadOnlyList<string> ResolveGcpInventoryPropertyKeys(string logicalName) =>
        logicalName switch
        {
            DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess => ["ipv4Enabled", "enablePublicAccess"],
            DeclarationSecurityPropertyLogicalNames.HttpsOnly => ["requireSsl"],
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion => ["sslMode"],
            DeclarationSecurityPropertyLogicalNames.StorageEncrypted => ["storageEncrypted"],
            DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction => ["defaultAction"],
            DeclarationSecurityPropertyLogicalNames.K8sPrivileged => ["privileged"],
            DeclarationSecurityPropertyLogicalNames.K8sHostNetwork => ["hostNetwork"],
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
