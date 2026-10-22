using System.Text.Json;

namespace ArchLucid.ArtifactSynthesis.Classifiers;

/// <summary>Deterministic security-baseline checks for Azure inventory <c>resources.json</c> rows (TB-2210).</summary>
public static class AzureInventorySecurityBaselineClassifier
{
    public static IReadOnlyList<InventorySecurityBaselineFinding> ClassifyFromResourcesJson(string resourcesJson)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(resourcesJson);

        using JsonDocument document = JsonDocument.Parse(resourcesJson);

        if (document.RootElement.ValueKind is not JsonValueKind.Array)
        {
            return [];
        }

        List<InventorySecurityBaselineFinding> findings = [];

        foreach (JsonElement row in document.RootElement.EnumerateArray())
        {
            InventorySecurityBaselineFinding? finding = TryClassifyRow(row);

            if (finding is not null)
            {
                findings.Add(finding);
            }
        }

        return findings;
    }

    private static InventorySecurityBaselineFinding? TryClassifyRow(JsonElement row)
    {
        string resourceType = ReadString(row, "resourceType");
        string resourceId = ReadString(row, "resourceId");

        if (string.IsNullOrWhiteSpace(resourceId))
        {
            resourceId = ReadString(row, "name");
        }

        if (string.IsNullOrWhiteSpace(resourceType) || string.IsNullOrWhiteSpace(resourceId))
        {
            return null;
        }

        if (!row.TryGetProperty("properties", out JsonElement properties))
        {
            return null;
        }

        if (resourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
            && HasBlobPublicAccessEnabled(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "Storage account allows blob public access.",
                "data-protection");
        }

        if (resourceType.Equals("Microsoft.Network/networkSecurityGroups", StringComparison.OrdinalIgnoreCase)
            && HasOpenAdminIngress(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "Network security group allows administrative ingress from the internet.",
                "network-isolation");
        }

        if (resourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
            && HasWeakSqlServerPosture(properties))
        {
            return new InventorySecurityBaselineFinding(
                resourceId,
                resourceType,
                "SQL server reports weak TLS posture or public network access enabled.",
                "encryption");
        }

        return null;
    }

    private static bool HasBlobPublicAccessEnabled(JsonElement properties)
    {
        if (!properties.TryGetProperty("allowBlobPublicAccess", out JsonElement allowBlobPublicAccess))
        {
            return false;
        }

        if (allowBlobPublicAccess.ValueKind is JsonValueKind.True)
        {
            return true;
        }

        if (allowBlobPublicAccess.ValueKind is JsonValueKind.False)
        {
            return false;
        }

        return string.Equals(allowBlobPublicAccess.GetString(), "true", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasOpenAdminIngress(JsonElement properties)
    {
        if (!properties.TryGetProperty("securityRules", out JsonElement securityRules))
        {
            return false;
        }

        if (securityRules.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement rule in securityRules.EnumerateArray())
        {
            if (!IsAllowInboundAdminRule(rule))
            {
                continue;
            }

            return true;
        }

        return false;
    }

    private static bool IsAllowInboundAdminRule(JsonElement rule)
    {
        JsonElement ruleProperties = rule;

        if (rule.TryGetProperty("properties", out JsonElement nestedProperties))
        {
            ruleProperties = nestedProperties;
        }

        string access = ReadString(ruleProperties, "access");

        if (access.Length > 0
            && !access.Equals("Allow", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        string direction = ReadString(ruleProperties, "direction");

        if (direction.Length > 0
            && !direction.Equals("Inbound", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!HasInternetSource(ruleProperties))
        {
            return false;
        }

        return HasAdministrativeDestinationPort(ruleProperties);
    }

    private static bool HasInternetSource(JsonElement ruleProperties)
    {
        string sourceAddressPrefix = ReadString(ruleProperties, "sourceAddressPrefix");
        string sourcePrefix = ReadString(ruleProperties, "sourcePrefix");

        if (sourceAddressPrefix is "*" or "0.0.0.0/0" or "Internet")
        {
            return true;
        }

        if (sourcePrefix is "*" or "0.0.0.0/0" or "Internet")
        {
            return true;
        }

        if (!ruleProperties.TryGetProperty("sourceAddressPrefixes", out JsonElement prefixes)
            || prefixes.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement prefix in prefixes.EnumerateArray())
        {
            string? value = prefix.GetString();

            if (value is "*" or "0.0.0.0/0" or "Internet")
            {
                return true;
            }
        }

        return false;
    }

    private static bool HasAdministrativeDestinationPort(JsonElement ruleProperties)
    {
        string destinationPortRange = ReadString(ruleProperties, "destinationPortRange");

        if (PortRangeIncludesAdminPort(destinationPortRange))
        {
            return true;
        }

        if (!ruleProperties.TryGetProperty("destinationPortRanges", out JsonElement portRanges)
            || portRanges.ValueKind is not JsonValueKind.Array)
        {
            return false;
        }

        foreach (JsonElement portRange in portRanges.EnumerateArray())
        {
            string? value = portRange.GetString();

            if (value is not null && PortRangeIncludesAdminPort(value))
            {
                return true;
            }
        }

        return false;
    }

    private static bool PortRangeIncludesAdminPort(string portRange)
    {
        if (string.IsNullOrWhiteSpace(portRange))
        {
            return false;
        }

        if (portRange.Equals("*", StringComparison.Ordinal))
        {
            return true;
        }

        if (portRange.Equals("22", StringComparison.Ordinal) || portRange.Equals("3389", StringComparison.Ordinal))
        {
            return true;
        }

        int separatorIndex = portRange.IndexOf('-', StringComparison.Ordinal);

        if (separatorIndex < 0)
        {
            return false;
        }

        if (!int.TryParse(portRange.AsSpan(0, separatorIndex), out int fromPort))
        {
            return false;
        }

        if (!int.TryParse(portRange.AsSpan(separatorIndex + 1), out int toPort))
        {
            return false;
        }

        return fromPort <= 22 && toPort >= 22
               || fromPort <= 3389 && toPort >= 3389;
    }

    private static bool HasWeakSqlServerPosture(JsonElement properties)
    {
        string minimalTlsVersion = ReadString(properties, "minimalTlsVersion");

        if (minimalTlsVersion.Equals("1.0", StringComparison.OrdinalIgnoreCase)
            || minimalTlsVersion.Equals("1.1", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        string publicNetworkAccess = ReadString(properties, "publicNetworkAccess");

        return publicNetworkAccess.Equals("Enabled", StringComparison.OrdinalIgnoreCase);
    }

    private static string ReadString(JsonElement row, string propertyName)
    {
        if (!row.TryGetProperty(propertyName, out JsonElement value))
        {
            return string.Empty;
        }

        return value.GetString()?.Trim() ?? string.Empty;
    }
}
