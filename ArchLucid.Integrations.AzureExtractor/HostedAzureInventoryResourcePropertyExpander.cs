using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Flattens ARM resource properties needed by SecureNow inventory materializers (IE-02 fidelity).
/// </summary>
internal static class HostedAzureInventoryResourcePropertyExpander
{
    public static Dictionary<string, object?> Expand(
        string resourceType,
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceType);

        if (propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return properties;
        }

        AddIdentityProperties(propertiesElement, properties);

        if (resourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            AddNicSubnetProperty(propertiesElement, properties);
        }

        if (resourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            AddPublicIpConfigurationProperty(propertiesElement, properties);
        }

        if (resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            AddPrivateEndpointTargetProperty(propertiesElement, properties);
        }

        if (resourceType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
        {
            AddJsonArrayProperty(propertiesElement, properties, "securityRules");
        }

        if (resourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
        {
            AddJsonArrayProperty(propertiesElement, properties, "subnets");
        }

        if (resourceType.Contains("userAssignedIdentities", StringComparison.OrdinalIgnoreCase))
        {
            AddManagedIdentityPrincipalProperties(propertiesElement, properties);
        }

        return properties;
    }

    private static void AddJsonArrayProperty(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties,
        string propertyName)
    {
        if (!propertiesElement.TryGetProperty(propertyName, out JsonElement arrayElement)
            || arrayElement.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        properties[propertyName] = arrayElement.GetRawText();
    }

    private static void AddManagedIdentityPrincipalProperties(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (propertiesElement.TryGetProperty("principalId", out JsonElement principalIdElement)
            && principalIdElement.ValueKind is JsonValueKind.String)
        {
            string? principalId = principalIdElement.GetString();

            if (!string.IsNullOrWhiteSpace(principalId))
            {
                properties["principalId"] = principalId.Trim();
            }
        }

        if (propertiesElement.TryGetProperty("clientId", out JsonElement clientIdElement)
            && clientIdElement.ValueKind is JsonValueKind.String)
        {
            string? clientId = clientIdElement.GetString();

            if (!string.IsNullOrWhiteSpace(clientId))
            {
                properties["clientId"] = clientId.Trim();
            }
        }
    }

    private static void AddIdentityProperties(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (!propertiesElement.TryGetProperty("identity", out JsonElement identityElement)
            || identityElement.ValueKind is not JsonValueKind.Object)
        {
            return;
        }

        properties["identity"] = identityElement.GetRawText();
    }

    private static void AddNicSubnetProperty(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        string? subnetId = TryReadFirstIpConfigurationProperty(propertiesElement, "subnet", "id");

        if (string.IsNullOrWhiteSpace(subnetId))
        {
            return;
        }

        properties["ipConfiguration.subnet.id"] = subnetId;
    }

    private static void AddPublicIpConfigurationProperty(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (propertiesElement.TryGetProperty("ipConfiguration", out JsonElement ipConfigurationElement)
            && ipConfigurationElement.ValueKind is JsonValueKind.Object
            && ipConfigurationElement.TryGetProperty("id", out JsonElement ipConfigurationIdElement)
            && ipConfigurationIdElement.ValueKind is JsonValueKind.String)
        {
            string? ipConfigurationId = ipConfigurationIdElement.GetString();

            if (!string.IsNullOrWhiteSpace(ipConfigurationId))
            {
                properties["ipConfiguration.id"] = ipConfigurationId.Trim();
                return;
            }
        }

        string? ipConfigurationIdFromArray = TryReadFirstIpConfigurationProperty(propertiesElement, "id");

        if (string.IsNullOrWhiteSpace(ipConfigurationIdFromArray))
        {
            return;
        }

        properties["ipConfiguration.id"] = ipConfigurationIdFromArray;
    }

    private static void AddPrivateEndpointTargetProperty(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (!propertiesElement.TryGetProperty("privateLinkServiceConnections", out JsonElement connections)
            || connections.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement connection in connections.EnumerateArray())
        {
            if (!connection.TryGetProperty("properties", out JsonElement connectionProperties)
                || connectionProperties.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            if (!connectionProperties.TryGetProperty("privateLinkServiceId", out JsonElement targetElement)
                || targetElement.ValueKind is not JsonValueKind.String)
            {
                continue;
            }

            string? targetId = targetElement.GetString();

            if (string.IsNullOrWhiteSpace(targetId))
            {
                continue;
            }

            properties["privateLinkServiceId"] = targetId.Trim();
            return;
        }
    }

    private static string? TryReadFirstIpConfigurationProperty(
        JsonElement propertiesElement,
        params string[] nestedPropertyNames)
    {
        if (!propertiesElement.TryGetProperty("ipConfigurations", out JsonElement ipConfigurations)
            || ipConfigurations.ValueKind is not JsonValueKind.Array)
        {
            return null;
        }

        foreach (JsonElement ipConfiguration in ipConfigurations.EnumerateArray())
        {
            if (!ipConfiguration.TryGetProperty("properties", out JsonElement ipConfigurationProperties)
                || ipConfigurationProperties.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            string? value = TryReadNestedString(ipConfigurationProperties, nestedPropertyNames);

            if (!string.IsNullOrWhiteSpace(value))
            {
                return value;
            }
        }

        return null;
    }

    private static string? TryReadNestedString(JsonElement current, IReadOnlyList<string> nestedPropertyNames)
    {
        for (int index = 0; index < nestedPropertyNames.Count; index++)
        {
            string propertyName = nestedPropertyNames[index];

            if (!current.TryGetProperty(propertyName, out JsonElement next))
            {
                return null;
            }

            if (index == nestedPropertyNames.Count - 1)
            {
                return next.ValueKind is JsonValueKind.String ? next.GetString() : null;
            }

            if (next.ValueKind is not JsonValueKind.Object)
            {
                return null;
            }

            current = next;
        }

        return null;
    }
}
