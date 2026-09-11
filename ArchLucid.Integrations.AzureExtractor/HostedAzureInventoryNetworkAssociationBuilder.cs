namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Derives <c>network-associations.json</c> rows from normalized hosted inventory resources.
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
            AddNicSubnetAssociation(resource, rows, keys);
            AddPublicIpAssociation(resource, rows, keys);
            AddPrivateEndpointAssociation(resource, rows, keys);
        }

        return rows;
    }

    private static void AddNicSubnetAssociation(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? subnetId = TryReadProperty(resource.Properties, "ipConfiguration.subnet.id", "subnetId");

        if (string.IsNullOrWhiteSpace(subnetId))
        {
            return;
        }

        AddRow(
            rows,
            keys,
            resource.ResourceId,
            subnetId.Trim(),
            "nicToSubnet");
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
            "publicIpToNic");
    }

    private static void AddPrivateEndpointAssociation(
        HostedAzureArmResourceRecord resource,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys)
    {
        if (!resource.ResourceType.Contains("privateEndpoints", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        string? targetResourceId = TryReadProperty(resource.Properties, "privateLinkServiceId");

        if (string.IsNullOrWhiteSpace(targetResourceId))
        {
            return;
        }

        AddRow(
            rows,
            keys,
            resource.ResourceId,
            targetResourceId.Trim(),
            "privateEndpointTarget");
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
