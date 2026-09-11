using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Derives <c>network-associations.json</c> rows from normalized hosted inventory resources (IE-RF-04–06).
/// </summary>
internal static class HostedAzureInventoryNetworkAssociationBuilder
{
    public static IReadOnlyList<HostedAzureArmNetworkAssociationRecord> Build(
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        List<HostedAzureArmNetworkAssociationRecord> rows = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            AddVirtualMachineAssociations(resource, rows, keys);
            AddNicAssociations(resource, rows, keys);
            AddPublicIpAssociation(resource, rows, keys);
            AddPrivateEndpointAssociations(resource, rows, keys);
            AddVirtualNetworkAssociations(resource, rows, keys);
            AddApplicationGatewayAssociations(resource, rows, keys);
            AddLoadBalancerAssociations(resource, rows, keys);
            AddPrivateDnsLinkAssociations(resource, rows, keys);
            AddAppServiceAssociations(resource, rows, keys);
        }

        return rows;
    }

    private static void AddVirtualMachineAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        foreach (string nicId in ReadDelimitedIds(resource.Properties, "networkProfile.networkInterfaces"))
        {
            AddRow(rows, keys, resource.ResourceId, nicId, AzureInventoryRelationshipAssociationTypes.VmToNic);
        }
    }

    private static void AddNicAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        foreach (string subnetId in ReadDelimitedIds(resource.Properties, "ipConfiguration.subnet.id"))
        {
            AddRow(rows, keys, resource.ResourceId, subnetId, AzureInventoryRelationshipAssociationTypes.NicToSubnet);
        }

        foreach (string publicIpId in ReadDelimitedIds(resource.Properties, "ipConfiguration.publicIPAddress.id"))
        {
            AddRow(
                rows,
                keys,
                publicIpId,
                resource.ResourceId,
                AzureInventoryRelationshipAssociationTypes.PublicIpToNic);
        }

        string? nsgId = TryReadProperty(resource.Properties, "networkSecurityGroup.id");

        if (!string.IsNullOrWhiteSpace(nsgId))
        {
            AddRow(rows, keys, resource.ResourceId, nsgId, AzureInventoryRelationshipAssociationTypes.NicToNsg);
        }
    }

    private static void AddPublicIpAssociation(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("publicIPAddresses", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? ipConfigurationId = TryReadProperty(resource.Properties, "ipConfiguration.id", "ipConfigurationId");

        if (string.IsNullOrWhiteSpace(ipConfigurationId))
        {
            return;
        }

        string? associatedResourceId = TryResolveAssociatedResourceFromIpConfiguration(ipConfigurationId);

        if (string.IsNullOrWhiteSpace(associatedResourceId))
        {
            return;
        }

        AddRow(
            rows,
            keys,
            resource.ResourceId,
            associatedResourceId,
            AzureInventoryRelationshipAssociationTypes.PublicIpToNic);
    }

    private static void AddPrivateEndpointAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        foreach (string targetResourceId in ReadDelimitedIds(resource.Properties, "privateLinkServiceId"))
        {
            AddRow(
                rows,
                keys,
                resource.ResourceId,
                targetResourceId,
                AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget);
        }

        string? subnetId = TryReadProperty(resource.Properties, "subnet.id");

        if (!string.IsNullOrWhiteSpace(subnetId))
        {
            AddRow(rows, keys, resource.ResourceId, subnetId, AzureInventoryRelationshipAssociationTypes.PeToSubnet);
        }

        foreach (string nicId in ReadDelimitedIds(resource.Properties, "networkInterfaces"))
        {
            AddRow(rows, keys, resource.ResourceId, nicId, AzureInventoryRelationshipAssociationTypes.PeToNic);
        }
    }

    private static void AddVirtualNetworkAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase)
            || resource.ResourceType.Contains("virtualNetworkLinks", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? subnetsJson = TryReadProperty(resource.Properties, "subnets");

        if (string.IsNullOrWhiteSpace(subnetsJson))
        {
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(subnetsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
            }

            foreach (JsonElement subnet in document.RootElement.EnumerateArray())
            {
                string? subnetId = TryReadSubnetId(subnet);

                if (string.IsNullOrWhiteSpace(subnetId))
                {
                    continue;
                }

                string? nsgId = TryReadSubnetNestedId(subnet, "networkSecurityGroup", "id");

                if (!string.IsNullOrWhiteSpace(nsgId))
                {
                    AddRow(rows, keys, subnetId, nsgId, AzureInventoryRelationshipAssociationTypes.SubnetToNsg);
                }

                string? routeTableId = TryReadSubnetNestedId(subnet, "routeTable", "id");

                if (!string.IsNullOrWhiteSpace(routeTableId))
                {
                    AddRow(
                        rows,
                        keys,
                        subnetId,
                        routeTableId,
                        AzureInventoryRelationshipAssociationTypes.SubnetToRouteTable);
                }
            }
        }
        catch (JsonException)
        {
            return;
        }

        string? peeringsJson = TryReadProperty(resource.Properties, "virtualNetworkPeerings");

        if (string.IsNullOrWhiteSpace(peeringsJson))
        {
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(peeringsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
            }

            foreach (JsonElement peering in document.RootElement.EnumerateArray())
            {
                string? remoteVnetId = TryReadPeeringRemoteVnetId(peering);

                if (string.IsNullOrWhiteSpace(remoteVnetId))
                {
                    continue;
                }

                AddRow(
                    rows,
                    keys,
                    resource.ResourceId,
                    remoteVnetId,
                    AzureInventoryRelationshipAssociationTypes.VnetPeering);
            }
        }
        catch (JsonException)
        {
        }
    }

    private static void AddApplicationGatewayAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("applicationGateways", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? backendPoolsJson = TryReadProperty(resource.Properties, "backendAddressPools");

        if (string.IsNullOrWhiteSpace(backendPoolsJson))
        {
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(backendPoolsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
            }

            foreach (JsonElement pool in document.RootElement.EnumerateArray())
            {
                if (!pool.TryGetProperty("properties", out JsonElement properties)
                    || properties.ValueKind is not JsonValueKind.Object
                    || !properties.TryGetProperty("backendAddresses", out JsonElement addresses)
                    || addresses.ValueKind is not JsonValueKind.Array)
                {
                    continue;
                }

                foreach (JsonElement address in addresses.EnumerateArray())
                {
                    string? backendId = TryReadAgwBackendArmId(address);

                    if (string.IsNullOrWhiteSpace(backendId))
                    {
                        continue;
                    }

                    string resolvedBackendId = TryResolveAssociatedResourceFromIpConfiguration(backendId) ?? backendId;

                    AddRow(
                        rows,
                        keys,
                        resource.ResourceId,
                        resolvedBackendId,
                        AzureInventoryRelationshipAssociationTypes.AgwToBackend);
                }
            }
        }
        catch (JsonException)
        {
        }
    }

    private static void AddLoadBalancerAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("loadBalancers", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? backendPoolsJson = TryReadProperty(resource.Properties, "backendAddressPools");

        if (string.IsNullOrWhiteSpace(backendPoolsJson))
        {
            return;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(backendPoolsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return;
            }

            foreach (JsonElement pool in document.RootElement.EnumerateArray())
            {
                if (!pool.TryGetProperty("properties", out JsonElement properties)
                    || properties.ValueKind is not JsonValueKind.Object
                    || !properties.TryGetProperty("backendIPConfigurations", out JsonElement configurations)
                    || configurations.ValueKind is not JsonValueKind.Array)
                {
                    continue;
                }

                foreach (JsonElement configuration in configurations.EnumerateArray())
                {
                    if (!configuration.TryGetProperty("id", out JsonElement idElement)
                        || idElement.ValueKind is not JsonValueKind.String)
                    {
                        continue;
                    }

                    string? ipConfigurationId = idElement.GetString();

                    if (string.IsNullOrWhiteSpace(ipConfigurationId))
                    {
                        continue;
                    }

                    string? backendResourceId = TryResolveAssociatedResourceFromIpConfiguration(ipConfigurationId);

                    if (string.IsNullOrWhiteSpace(backendResourceId))
                    {
                        continue;
                    }

                    AddRow(
                        rows,
                        keys,
                        resource.ResourceId,
                        backendResourceId,
                        AzureInventoryRelationshipAssociationTypes.LbToBackend);
                }
            }
        }
        catch (JsonException)
        {
        }
    }

    private static void AddPrivateDnsLinkAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("virtualNetworkLinks", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? zoneId = TryReadProperty(resource.Properties, "privateDnsZoneId");
        string? vnetId = TryReadProperty(resource.Properties, "virtualNetwork.id");

        if (string.IsNullOrWhiteSpace(zoneId) || string.IsNullOrWhiteSpace(vnetId))
        {
            return;
        }

        AddRow(
            rows,
            keys,
            zoneId,
            vnetId,
            AzureInventoryRelationshipAssociationTypes.PrivateDnsVnetLink);
    }

    private static void AddAppServiceAssociations(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? subnetId = TryReadProperty(resource.Properties, "virtualNetworkSubnetId");

        if (string.IsNullOrWhiteSpace(subnetId))
        {
            return;
        }

        AddRow(
            rows,
            keys,
            resource.ResourceId,
            subnetId,
            AzureInventoryRelationshipAssociationTypes.AppServiceToSubnet);
    }

    private static IEnumerable<string> ReadDelimitedIds(
        IReadOnlyDictionary<string, object?>? properties,
        string propertyKeyPrefix)
    {
        if (properties is null)
        {
            yield break;
        }

        List<string> values = [];

        foreach (KeyValuePair<string, object?> property in properties)
        {
            if (!property.Key.StartsWith(propertyKeyPrefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string? text = property.Value?.ToString();

            if (!string.IsNullOrWhiteSpace(text))
            {
                values.Add(text.Trim());
            }
        }

        if (values.Count == 0 && properties.TryGetValue(propertyKeyPrefix, out object? singleValue))
        {
            string? text = singleValue?.ToString();

            if (!string.IsNullOrWhiteSpace(text))
            {
                values.Add(text.Trim());
            }
        }

        foreach (string value in values.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            yield return value;
        }
    }

    private static string? TryReadSubnetId(JsonElement subnet)
    {
        if (subnet.TryGetProperty("id", out JsonElement idElement) && idElement.ValueKind is JsonValueKind.String)
        {
            return idElement.GetString();
        }

        return null;
    }

    private static string? TryReadSubnetNestedId(JsonElement subnet, string objectName, string propertyName)
    {
        if (!subnet.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object
            || !properties.TryGetProperty(objectName, out JsonElement nested)
            || nested.ValueKind is not JsonValueKind.Object
            || !nested.TryGetProperty(propertyName, out JsonElement idElement)
            || idElement.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        return idElement.GetString();
    }

    private static string? TryReadAgwBackendArmId(JsonElement address)
    {
        if (address.TryGetProperty("id", out JsonElement idElement) && idElement.ValueKind is JsonValueKind.String)
        {
            string? directId = idElement.GetString();

            if (!string.IsNullOrWhiteSpace(directId) && directId.StartsWith("/", StringComparison.Ordinal))
            {
                return directId;
            }
        }

        if (address.TryGetProperty("networkInterfaceIPConfiguration", out JsonElement ipConfiguration)
            && ipConfiguration.ValueKind is JsonValueKind.Object
            && ipConfiguration.TryGetProperty("id", out JsonElement ipConfigurationIdElement)
            && ipConfigurationIdElement.ValueKind is JsonValueKind.String)
        {
            return ipConfigurationIdElement.GetString();
        }

        return null;
    }

    private static string? TryReadPeeringRemoteVnetId(JsonElement peering)
    {
        if (!peering.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object
            || !properties.TryGetProperty("remoteVirtualNetwork", out JsonElement remote)
            || remote.ValueKind is not JsonValueKind.Object
            || !remote.TryGetProperty("id", out JsonElement idElement)
            || idElement.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        return idElement.GetString();
    }

    private static void AddRow(
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys,
        string fromResourceId,
        string toResourceId,
        string associationType,
        string? ruleName = null)
    {
        string key = $"{fromResourceId}|{associationType}|{toResourceId}|{ruleName}";

        if (!keys.Add(key))
        {
            return;
        }

        rows.Add(new HostedAzureArmNetworkAssociationRecord(
            fromResourceId,
            toResourceId,
            associationType,
            ruleName));
    }

    private static string? TryReadProperty(
        IReadOnlyDictionary<string, object?>? properties,
        params string[] propertyKeys)
    {
        if (properties is null)
        {
            return null;
        }

        foreach (string propertyKey in propertyKeys)
        {
            if (!properties.TryGetValue(propertyKey, out object? value) || value is null)
            {
                continue;
            }

            string? text = value.ToString();

            if (!string.IsNullOrWhiteSpace(text))
            {
                return text;
            }
        }

        return null;
    }

    private static string? TryResolveAssociatedResourceFromIpConfiguration(string ipConfigurationId)
    {
        string normalized = ipConfigurationId.Trim();
        int ipConfigurationsIndex = normalized.IndexOf("/ipConfigurations/", StringComparison.OrdinalIgnoreCase);

        if (ipConfigurationsIndex <= 0)
        {
            return null;
        }

        return normalized[..ipConfigurationsIndex];
    }
}
