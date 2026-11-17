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

        if (logicalName == DeclarationSecurityPropertyLogicalNames.NetworkAclDefaultAction
            && TryReadNestedNetworkAclDefaultAction(properties, out string? nestedDefaultAction))
        {
            value = nestedDefaultAction;
            return true;
        }

        if (logicalName == DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion
            && TryReadNestedSiteConfigMinTlsVersion(properties, out string? nestedMinTlsVersion))
        {
            value = nestedMinTlsVersion;
            return true;
        }

        if (logicalName == DeclarationSecurityPropertyLogicalNames.HttpsOnly
            && cloudProvider is InventoryTopologyCloudProvider.Gcp
            && TryReadNestedGcpIpConfigurationField(properties, "requireSsl", out string? nestedRequireSsl))
        {
            value = nestedRequireSsl;
            return true;
        }

        if (logicalName == DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess
            && cloudProvider is InventoryTopologyCloudProvider.Gcp
            && TryReadNestedGcpIpConfigurationField(properties, "ipv4Enabled", out string? nestedIpv4Enabled))
        {
            value = nestedIpv4Enabled;
            return true;
        }

        if (logicalName == DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess
            && cloudProvider is InventoryTopologyCloudProvider.Azure)
        {
            // Book ch. 6 storage_public_exposure treats an omitted publicNetworkAccess as Enabled.
            value = "Enabled";
            return true;
        }

        value = null;
        return false;
    }

    internal static bool IsUncontradictableAzurePublicNetworkAccessInventoryValue(string? inventoryValue) =>
        string.Equals(inventoryValue?.Trim(), "SecuredByPerimeter", StringComparison.OrdinalIgnoreCase);

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
            DeclarationSecurityPropertyLogicalNames.HttpsOnly =>
            [
                "httpsOnly",
                "supportsHttpsTrafficOnly",
                "enableHttpsTrafficOnly",
            ],
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion => ["minimalTlsVersion", "minimumTlsVersion"],
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled => ["sslEnforcementEnabled", "sslEnforcement"],
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
            DeclarationSecurityPropertyLogicalNames.SslEnforcementEnabled => ["sslEnforcementEnabled", "sslEnforcement"],
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

    private static bool TryReadNestedNetworkAclDefaultAction(JsonElement properties, out string? value)
    {
        value = null;

        if (properties.ValueKind is not JsonValueKind.Object)
            return false;

        if (!TryGetPropertyIgnoreCase(properties, "networkAcls", out JsonElement networkAcls)
            || networkAcls.ValueKind is not JsonValueKind.Object)
            return false;

        return TryReadPropertyIgnoreCase(networkAcls, "defaultAction", out value);
    }

    private static bool TryReadNestedSiteConfigMinTlsVersion(JsonElement properties, out string? value)
    {
        value = null;

        if (properties.ValueKind is not JsonValueKind.Object)
            return false;

        if (!TryGetPropertyIgnoreCase(properties, "siteConfig", out JsonElement siteConfig)
            || siteConfig.ValueKind is not JsonValueKind.Object)
            return false;

        return TryReadPropertyIgnoreCase(siteConfig, "minTlsVersion", out value);
    }

    private static bool TryReadNestedGcpIpConfigurationField(
        JsonElement properties,
        string fieldName,
        out string? value)
    {
        value = null;

        if (properties.ValueKind is not JsonValueKind.Object)
            return false;

        if (TryGetPropertyIgnoreCase(properties, "settings", out JsonElement settings)
            && settings.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(settings, "ipConfiguration", out JsonElement ipConfiguration)
            && ipConfiguration.ValueKind is JsonValueKind.Object
            && TryReadPropertyIgnoreCase(ipConfiguration, fieldName, out value))
        {
            return true;
        }

        if (TryGetPropertyIgnoreCase(properties, "ipConfiguration", out JsonElement flatIpConfiguration)
            && flatIpConfiguration.ValueKind is JsonValueKind.Object)
        {
            return TryReadPropertyIgnoreCase(flatIpConfiguration, fieldName, out value);
        }

        return false;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind is JsonValueKind.Object)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                    continue;

                value = property.Value;
                return true;
            }
        }

        value = default;
        return false;
    }

    private static bool TryReadPropertyIgnoreCase(JsonElement properties, string key, out string? value)
    {
        if (!TryGetPropertyIgnoreCase(properties, key, out JsonElement element))
        {
            value = null;
            return false;
        }

        value = JsonElementToNormalizedString(element);
        return !string.IsNullOrWhiteSpace(value);
    }

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
