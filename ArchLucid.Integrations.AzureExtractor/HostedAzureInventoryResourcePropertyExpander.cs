using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Flattens ARM resource properties needed by SecureNow inventory materializers (IE-RF-04–06).
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

        if (resourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
        {
            AddVirtualMachineNetworkProfileProperties(propertiesElement, properties);
        }

        if (resourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            AddNicProperties(propertiesElement, properties);
        }

        if (resourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            AddPublicIpConfigurationProperty(propertiesElement, properties);
        }

        if (resourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            AddPrivateEndpointProperties(propertiesElement, properties);
        }

        if (resourceType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
        {
            AddJsonArrayProperty(propertiesElement, properties, "securityRules");
        }

        if (resourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
        {
            AddJsonArrayProperty(propertiesElement, properties, "subnets");
            AddJsonArrayProperty(propertiesElement, properties, "virtualNetworkPeerings");
        }

        if (resourceType.Contains("applicationGateways", StringComparison.OrdinalIgnoreCase))
        {
            AddJsonArrayProperty(propertiesElement, properties, "backendAddressPools");
        }

        if (resourceType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase))
        {
            AddJsonArrayProperty(propertiesElement, properties, "backendAddressPools");
        }

        if (resourceType.Contains("virtualNetworkLinks", StringComparison.OrdinalIgnoreCase))
        {
            AddPrivateDnsLinkProperties(propertiesElement, properties);
        }

        if (resourceType.Contains("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase))
        {
            AddAppServiceSubnetProperty(propertiesElement, properties);
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

    private static void AddVirtualMachineNetworkProfileProperties(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (!propertiesElement.TryGetProperty("networkProfile", out JsonElement networkProfile)
            || networkProfile.ValueKind is not JsonValueKind.Object
            || !networkProfile.TryGetProperty("networkInterfaces", out JsonElement networkInterfaces)
            || networkInterfaces.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        int index = 0;

        foreach (JsonElement networkInterface in networkInterfaces.EnumerateArray())
        {
            if (!networkInterface.TryGetProperty("id", out JsonElement idElement)
                || idElement.ValueKind is not JsonValueKind.String)
            {
                continue;
            }

            string? nicId = idElement.GetString();

            if (string.IsNullOrWhiteSpace(nicId))
            {
                continue;
            }

            properties[$"networkProfile.networkInterfaces[{index}]"] = nicId.Trim();
            index++;
        }

        if (index > 0)
        {
            properties["networkProfile.networkInterfaces"] = string.Join(
                '|',
                properties.Where(pair => pair.Key.StartsWith("networkProfile.networkInterfaces[", StringComparison.Ordinal))
                    .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                    .Select(pair => pair.Value?.ToString())
                    .Where(value => !string.IsNullOrWhiteSpace(value))!);
        }
    }

    private static void AddNicProperties(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (propertiesElement.TryGetProperty("networkSecurityGroup", out JsonElement nsgElement)
            && nsgElement.ValueKind is JsonValueKind.Object
            && nsgElement.TryGetProperty("id", out JsonElement nsgIdElement)
            && nsgIdElement.ValueKind is JsonValueKind.String)
        {
            string? nsgId = nsgIdElement.GetString();

            if (!string.IsNullOrWhiteSpace(nsgId))
            {
                properties["networkSecurityGroup.id"] = nsgId.Trim();
            }
        }

        if (!propertiesElement.TryGetProperty("ipConfigurations", out JsonElement ipConfigurations)
            || ipConfigurations.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        int index = 0;

        foreach (JsonElement ipConfiguration in ipConfigurations.EnumerateArray())
        {
            if (!ipConfiguration.TryGetProperty("properties", out JsonElement ipConfigurationProperties)
                || ipConfigurationProperties.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            string? subnetId = TryReadNestedString(ipConfigurationProperties, "subnet", "id");
            string? publicIpId = TryReadNestedString(ipConfigurationProperties, "publicIPAddress", "id");

            if (!string.IsNullOrWhiteSpace(subnetId))
            {
                properties[$"ipConfiguration.subnet.id[{index}]"] = subnetId;
            }

            if (!string.IsNullOrWhiteSpace(publicIpId))
            {
                properties[$"ipConfiguration.publicIPAddress.id[{index}]"] = publicIpId;
            }

            if (index == 0)
            {
                if (!string.IsNullOrWhiteSpace(subnetId))
                {
                    properties["ipConfiguration.subnet.id"] = subnetId;
                }
            }

            index++;
        }
    }

    private static void AddPrivateEndpointProperties(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        AddPrivateLinkConnections(propertiesElement, properties, "privateLinkServiceConnections");
        AddPrivateLinkConnections(propertiesElement, properties, "manualPrivateLinkServiceConnections");

        if (propertiesElement.TryGetProperty("subnet", out JsonElement subnetElement)
            && subnetElement.ValueKind is JsonValueKind.Object
            && subnetElement.TryGetProperty("id", out JsonElement subnetIdElement)
            && subnetIdElement.ValueKind is JsonValueKind.String)
        {
            string? subnetId = subnetIdElement.GetString();

            if (!string.IsNullOrWhiteSpace(subnetId))
            {
                properties["subnet.id"] = subnetId.Trim();
            }
        }

        if (propertiesElement.TryGetProperty("networkInterfaces", out JsonElement networkInterfaces)
            && networkInterfaces.ValueKind is JsonValueKind.Array)
        {
            int index = 0;

            foreach (JsonElement networkInterface in networkInterfaces.EnumerateArray())
            {
                if (!networkInterface.TryGetProperty("id", out JsonElement idElement)
                    || idElement.ValueKind is not JsonValueKind.String)
                {
                    continue;
                }

                string? nicId = idElement.GetString();

                if (string.IsNullOrWhiteSpace(nicId))
                {
                    continue;
                }

                properties[$"networkInterfaces[{index}]"] = nicId.Trim();
                index++;
            }

            if (index > 0)
            {
                properties["networkInterfaces"] = string.Join(
                    '|',
                    properties.Where(pair => pair.Key.StartsWith("networkInterfaces[", StringComparison.Ordinal))
                        .OrderBy(pair => pair.Key, StringComparer.Ordinal)
                        .Select(pair => pair.Value?.ToString())
                        .Where(value => !string.IsNullOrWhiteSpace(value))!);
            }
        }
    }

    private static void AddPrivateLinkConnections(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties,
        string propertyName)
    {
        if (!propertiesElement.TryGetProperty(propertyName, out JsonElement connections)
            || connections.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        int index = 0;

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

            properties[$"privateLinkServiceId[{index}]"] = targetId.Trim();

            if (!properties.ContainsKey("privateLinkServiceId"))
            {
                properties["privateLinkServiceId"] = targetId.Trim();
            }

            index++;
        }
    }

    private static void AddPrivateDnsLinkProperties(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (propertiesElement.TryGetProperty("virtualNetwork", out JsonElement virtualNetwork)
            && virtualNetwork.ValueKind is JsonValueKind.Object
            && virtualNetwork.TryGetProperty("id", out JsonElement vnetIdElement)
            && vnetIdElement.ValueKind is JsonValueKind.String)
        {
            string? vnetId = vnetIdElement.GetString();

            if (!string.IsNullOrWhiteSpace(vnetId))
            {
                properties["virtualNetwork.id"] = vnetId.Trim();
            }
        }
    }

    private static void AddAppServiceSubnetProperty(
        JsonElement propertiesElement,
        Dictionary<string, object?> properties)
    {
        if (!propertiesElement.TryGetProperty("virtualNetworkSubnetId", out JsonElement subnetIdElement)
            || subnetIdElement.ValueKind is not JsonValueKind.String)
        {
            return;
        }

        string? subnetId = subnetIdElement.GetString();

        if (!string.IsNullOrWhiteSpace(subnetId))
        {
            properties["virtualNetworkSubnetId"] = subnetId.Trim();
        }
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
            }
        }
    }

    private static string? TryReadNestedString(JsonElement current, params string[] nestedPropertyNames)
    {
        for (int index = 0; index < nestedPropertyNames.Length; index++)
        {
            string propertyName = nestedPropertyNames[index];

            if (!current.TryGetProperty(propertyName, out JsonElement next))
            {
                return null;
            }

            if (index == nestedPropertyNames.Length - 1)
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
