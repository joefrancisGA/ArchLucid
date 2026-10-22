using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Derives conservative <c>nsgAllowRule</c> rows for reachability path evidence (IE-02).
/// </summary>
internal static class HostedAzureInventoryNsgAllowRuleBuilder
{
    private const string StorageServiceTag = "Storage";

    public static IReadOnlyList<HostedAzureArmNetworkAssociationRecord> Build(
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        Dictionary<string, List<NsgAllowRule>> allowRulesByNsgId = BuildAllowRulesByNsgId(resources);
        Dictionary<string, string> subnetResourceGroupById = BuildSubnetResourceGroups(resources);
        Dictionary<string, List<string>> storageAccountsByResourceGroup = BuildStorageAccountsByResourceGroup(resources);

        List<HostedAzureArmNetworkAssociationRecord> rows = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, string> subnetEntry in subnetResourceGroupById)
        {
            string subnetId = subnetEntry.Key;
            string resourceGroupName = subnetEntry.Value;

            if (!TryResolveNsgIdForSubnet(subnetId, resources, out string? nsgId)
                || string.IsNullOrWhiteSpace(nsgId))
            {
                continue;
            }

            if (!allowRulesByNsgId.TryGetValue(nsgId, out List<NsgAllowRule>? allowRules))
            {
                continue;
            }

            if (!storageAccountsByResourceGroup.TryGetValue(resourceGroupName, out List<string>? storageAccountIds))
            {
                continue;
            }

            foreach (NsgAllowRule allowRule in allowRules)
            {
                foreach (string storageAccountId in storageAccountIds)
                {
                    AddRow(rows, keys, subnetId, storageAccountId, allowRule.RuleName);
                }
            }
        }

        return rows;
    }

    private static Dictionary<string, List<NsgAllowRule>> BuildAllowRulesByNsgId(
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        Dictionary<string, List<NsgAllowRule>> allowRulesByNsgId =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Contains("networkSecurityGroups", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryReadJsonArrayProperty(resource.Properties, "securityRules", out JsonElement securityRules))
            {
                continue;
            }

            List<NsgAllowRule> allowRules = [];

            foreach (JsonElement ruleElement in securityRules.EnumerateArray())
            {
                if (!TryParseInboundStorageAllowRule(ruleElement, out NsgAllowRule? allowRule)
                    || allowRule is null)
                {
                    continue;
                }

                allowRules.Add(allowRule);
            }

            if (allowRules.Count > 0)
            {
                allowRulesByNsgId[resource.ResourceId] = allowRules;
            }
        }

        return allowRulesByNsgId;
    }

    private static Dictionary<string, string> BuildSubnetResourceGroups(
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        Dictionary<string, string> subnetResourceGroupById = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryReadJsonArrayProperty(resource.Properties, "subnets", out JsonElement subnets))
            {
                continue;
            }

            string? vnetResourceGroup = TryReadResourceGroupName(resource.ResourceId);

            if (string.IsNullOrWhiteSpace(vnetResourceGroup))
            {
                continue;
            }

            foreach (JsonElement subnetElement in subnets.EnumerateArray())
            {
                string? subnetId = TryReadStringProperty(subnetElement, "id");

                if (string.IsNullOrWhiteSpace(subnetId))
                {
                    continue;
                }

                subnetResourceGroupById[subnetId.Trim()] = vnetResourceGroup;
            }
        }

        return subnetResourceGroupById;
    }

    private static Dictionary<string, List<string>> BuildStorageAccountsByResourceGroup(
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        Dictionary<string, List<string>> storageAccountsByResourceGroup =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Contains("storageAccounts", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string? resourceGroupName = TryReadResourceGroupName(resource.ResourceId);

            if (string.IsNullOrWhiteSpace(resourceGroupName))
            {
                continue;
            }

            if (!storageAccountsByResourceGroup.TryGetValue(resourceGroupName, out List<string>? storageAccountIds))
            {
                storageAccountIds = [];
                storageAccountsByResourceGroup[resourceGroupName] = storageAccountIds;
            }

            storageAccountIds.Add(resource.ResourceId);
        }

        return storageAccountsByResourceGroup;
    }

    private static bool TryResolveNsgIdForSubnet(
        string subnetId,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        out string? nsgId)
    {
        nsgId = null;

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Contains("virtualNetworks", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryReadJsonArrayProperty(resource.Properties, "subnets", out JsonElement subnets))
            {
                continue;
            }

            foreach (JsonElement subnetElement in subnets.EnumerateArray())
            {
                string? candidateSubnetId = TryReadStringProperty(subnetElement, "id");

                if (!string.Equals(candidateSubnetId, subnetId, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!subnetElement.TryGetProperty("properties", out JsonElement subnetProperties)
                    || subnetProperties.ValueKind is not JsonValueKind.Object)
                {
                    return false;
                }

                if (!subnetProperties.TryGetProperty("networkSecurityGroup", out JsonElement nsgElement)
                    || nsgElement.ValueKind is not JsonValueKind.Object)
                {
                    return false;
                }

                nsgId = TryReadStringProperty(nsgElement, "id");
                return !string.IsNullOrWhiteSpace(nsgId);
            }
        }

        return false;
    }

    private static bool TryParseInboundStorageAllowRule(JsonElement ruleElement, out NsgAllowRule? allowRule)
    {
        allowRule = null;

        string? ruleName = TryReadStringProperty(ruleElement, "name");

        if (string.IsNullOrWhiteSpace(ruleName))
        {
            return false;
        }

        if (!ruleElement.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? access = TryReadStringProperty(properties, "access");
        string? direction = TryReadStringProperty(properties, "direction");

        if (!string.Equals(access, "Allow", StringComparison.OrdinalIgnoreCase)
            || !string.Equals(direction, "Inbound", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!RuleTargetsStorageServiceTag(properties))
        {
            return false;
        }

        allowRule = new NsgAllowRule(ruleName.Trim());
        return true;
    }

    private static bool RuleTargetsStorageServiceTag(JsonElement properties)
    {
        if (TryReadStringProperty(properties, "destinationAddressPrefix") is { } prefix
            && prefix.Equals(StorageServiceTag, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (properties.TryGetProperty("destinationAddressPrefixes", out JsonElement prefixesElement)
            && prefixesElement.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement prefixElement in prefixesElement.EnumerateArray())
            {
                if (prefixElement.ValueKind == JsonValueKind.String
                    && prefixElement.GetString()?.Equals(StorageServiceTag, StringComparison.OrdinalIgnoreCase) == true)
                {
                    return true;
                }
            }
        }

        if (properties.TryGetProperty("destinationServiceTags", out JsonElement serviceTagsElement)
            && serviceTagsElement.ValueKind == JsonValueKind.Array)
        {
            foreach (JsonElement serviceTagElement in serviceTagsElement.EnumerateArray())
            {
                if (serviceTagElement.ValueKind == JsonValueKind.String
                    && serviceTagElement.GetString()?.Equals(StorageServiceTag, StringComparison.OrdinalIgnoreCase) == true)
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool TryReadJsonArrayProperty(
        IReadOnlyDictionary<string, object?>? properties,
        string propertyName,
        out JsonElement arrayElement)
    {
        arrayElement = default;

        if (properties is null
            || !properties.TryGetValue(propertyName, out object? value)
            || value is null)
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(value.ToString()!);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return false;
            }

            arrayElement = document.RootElement.Clone();
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string? TryReadStringProperty(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value)
            || value.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        string? parsed = value.GetString();

        return string.IsNullOrWhiteSpace(parsed) ? null : parsed.Trim();
    }

    private static string? TryReadResourceGroupName(string resourceId)
    {
        const string marker = "/resourceGroups/";
        int markerIndex = resourceId.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

        if (markerIndex < 0)
        {
            return null;
        }

        int startIndex = markerIndex + marker.Length;
        int endIndex = resourceId.IndexOf('/', startIndex);

        if (endIndex < 0)
        {
            return null;
        }

        return resourceId[startIndex..endIndex];
    }

    private static void AddRow(
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> keys,
        string subnetId,
        string targetResourceId,
        string ruleName)
    {
        string key = $"{subnetId}|nsgAllowRule|{targetResourceId}|{ruleName}";

        if (!keys.Add(key))
        {
            return;
        }

        rows.Add(new HostedAzureArmNetworkAssociationRecord(
            subnetId,
            targetResourceId,
            "nsgAllowRule",
            ruleName));
    }

    private sealed record NsgAllowRule(string RuleName);
}
