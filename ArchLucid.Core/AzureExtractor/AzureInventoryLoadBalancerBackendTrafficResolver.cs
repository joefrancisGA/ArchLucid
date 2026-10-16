using System.Text.Json;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Resolves stored load balancer and application gateway backend targets (NR-25).</summary>
public static class AzureInventoryLoadBalancerBackendTrafficResolver
{
    public sealed record BackendTarget(string TargetArmId, int? RulePort);

    public static IReadOnlyList<BackendTarget> ResolveLoadBalancerBackends(GraphNode loadBalancerNode)
    {
        ArgumentNullException.ThrowIfNull(loadBalancerNode);

        Dictionary<string, int?> portByPoolId = BuildLoadBalancerPortByPoolId(loadBalancerNode.Properties);

        if (!loadBalancerNode.Properties.TryGetValue("backendAddressPools", out string? poolsJson)
            || string.IsNullOrWhiteSpace(poolsJson))
        {
            return [];
        }

        return ParseLoadBalancerBackendTargets(poolsJson, portByPoolId);
    }

    private static List<BackendTarget> ParseLoadBalancerBackendTargets(
        string poolsJson,
        IReadOnlyDictionary<string, int?> portByPoolId)
    {
        List<BackendTarget> targets = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(poolsJson);
            JsonElement poolsRoot = document.RootElement;

            if (poolsRoot.ValueKind is JsonValueKind.String)
            {
                string? nestedPoolsJson = poolsRoot.GetString();

                if (string.IsNullOrWhiteSpace(nestedPoolsJson))
                {
                    return targets;
                }

                return ParseLoadBalancerBackendTargets(nestedPoolsJson, portByPoolId);
            }

            if (!AzureExtractorJsonArrayRoot.TryCloneRows(poolsRoot, out JsonElement[] pools))
            {
                return targets;
            }

            foreach (JsonElement pool in pools)
            {
                string? poolId = TryReadPoolId(pool);
                int? rulePort = null;

                if (!string.IsNullOrWhiteSpace(poolId))
                {
                    portByPoolId.TryGetValue(ArmResourceIdNormalizer.Normalize(poolId), out rulePort);
                }

                if (!TryGetBackendAddressPoolPropertiesBag(pool, out JsonElement properties))
                {
                    continue;
                }

                AddIpConfigurationTargets(targets, properties, "backendIPConfigurations", rulePort, nestedAddress: false);
                AddIpConfigurationTargets(targets, properties, "loadBalancerBackendAddresses", rulePort, nestedAddress: true);
            }
        }
        catch (JsonException)
        {
            return targets;
        }

        return targets;
    }

    public static IReadOnlyList<BackendTarget> ResolveApplicationGatewayBackends(GraphNode applicationGatewayNode)
    {
        ArgumentNullException.ThrowIfNull(applicationGatewayNode);

        if (!applicationGatewayNode.Properties.TryGetValue("backendAddressPools", out string? poolsJson)
            || string.IsNullOrWhiteSpace(poolsJson))
        {
            return [];
        }

        return ParseApplicationGatewayBackendTargets(poolsJson);
    }

    private static List<BackendTarget> ParseApplicationGatewayBackendTargets(string poolsJson)
    {
        List<BackendTarget> targets = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(poolsJson);
            JsonElement poolsRoot = document.RootElement;

            if (poolsRoot.ValueKind is JsonValueKind.String)
            {
                string? nestedPoolsJson = poolsRoot.GetString();

                if (string.IsNullOrWhiteSpace(nestedPoolsJson))
                {
                    return targets;
                }

                return ParseApplicationGatewayBackendTargets(nestedPoolsJson);
            }

            if (!AzureExtractorJsonArrayRoot.TryCloneRows(poolsRoot, out JsonElement[] pools))
            {
                return targets;
            }

            foreach (JsonElement pool in pools)
            {
                if (!TryGetBackendAddressPoolPropertiesBag(pool, out JsonElement properties))
                {
                    continue;
                }

                if (TryGetPropertyIgnoreCase(properties, "backendAddresses", out JsonElement addresses)
                    && addresses.ValueKind is JsonValueKind.Array)
                {
                    foreach (JsonElement address in addresses.EnumerateArray())
                    {
                        string? backendArmId = AzureInventoryApplicationGatewayBackendAddressReader.TryReadBackendResourceArmId(address);

                        if (string.IsNullOrWhiteSpace(backendArmId))
                        {
                            continue;
                        }

                        targets.Add(new BackendTarget(ArmResourceIdNormalizer.Normalize(backendArmId), null));
                    }
                }

                // NIC members sit on backendIPConfigurations. backendAddresses is the IP or FQDN list.
                AddIpConfigurationTargets(targets, properties, "backendIPConfigurations", rulePort: null, nestedAddress: false);
            }
        }
        catch (JsonException)
        {
            return targets;
        }

        return targets;
    }

    private static Dictionary<string, int?> BuildLoadBalancerPortByPoolId(IReadOnlyDictionary<string, string> properties)
    {
        Dictionary<string, int?> portByPoolId = new(StringComparer.OrdinalIgnoreCase);

        if (!properties.TryGetValue("loadBalancingRules", out string? rulesJson)
            || string.IsNullOrWhiteSpace(rulesJson))
        {
            return portByPoolId;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(rulesJson);
            JsonElement rulesRoot = document.RootElement;

            if (rulesRoot.ValueKind is JsonValueKind.String)
            {
                string? nestedRulesJson = rulesRoot.GetString();

                if (string.IsNullOrWhiteSpace(nestedRulesJson))
                {
                    return portByPoolId;
                }

                return BuildLoadBalancerPortByPoolId(
                    new Dictionary<string, string>(StringComparer.Ordinal)
                    {
                        ["loadBalancingRules"] = nestedRulesJson,
                    });
            }

            if (!AzureExtractorJsonArrayRoot.TryCloneRows(rulesRoot, out JsonElement[] rules))
            {
                return portByPoolId;
            }

            foreach (JsonElement rule in rules)
            {
                if (!AzureExtractorJsonObjectElement.TryUnwrapObject(rule, out JsonElement ruleElement))
                {
                    continue;
                }

                if (!TryGetLoadBalancingRulePropertiesBag(ruleElement, out JsonElement ruleProperties))
                {
                    continue;
                }

                if (!TryGetPropertyIgnoreCase(ruleProperties, "backendAddressPool", out JsonElement poolReference))
                {
                    continue;
                }

                string? poolId = TryReadBackendPoolReferenceId(poolReference);

                if (string.IsNullOrWhiteSpace(poolId))
                {
                    continue;
                }

                int? port = TryReadBackendPort(ruleProperties);
                portByPoolId[ArmResourceIdNormalizer.Normalize(poolId)] = port;
            }
        }
        catch (JsonException)
        {
            return portByPoolId;
        }

        return portByPoolId;
    }

    /// <summary>
    /// NIC pools list ip configuration ids directly. Standard IP-based pools nest the same id under
    /// <c>loadBalancerBackendAddresses[].properties.networkInterfaceIPConfiguration</c>.
    /// </summary>
    private static void AddIpConfigurationTargets(
        List<BackendTarget> targets,
        JsonElement poolProperties,
        string collectionName,
        int? rulePort,
        bool nestedAddress)
    {
        if (!TryGetPropertyIgnoreCase(poolProperties, collectionName, out JsonElement configurations)
            || configurations.ValueKind is not JsonValueKind.Array)
        {
            return;
        }

        foreach (JsonElement configuration in configurations.EnumerateArray())
        {

            if (!AzureExtractorJsonObjectElement.TryResolveCollectionElement(configuration, nestedAddress, out JsonElement configurationElement))
            {
                continue;
            }

            string? ipConfigurationId = nestedAddress
                ? TryReadNestedNetworkInterfaceIpConfigurationId(configurationElement)
                : TryReadDirectId(configurationElement);

            if (string.IsNullOrWhiteSpace(ipConfigurationId))
            {
                continue;
            }

            string? backendArmId = AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(
                ipConfigurationId);

            if (string.IsNullOrWhiteSpace(backendArmId))
            {
                continue;
            }

            targets.Add(new BackendTarget(ArmResourceIdNormalizer.Normalize(backendArmId), rulePort));
        }
    }

    private static string? TryReadDirectId(JsonElement configuration)
    {
        if (configuration.ValueKind is JsonValueKind.String)
        {
            return configuration.GetString();
        }

        if (!TryGetPropertyIgnoreCase(configuration, "id", out JsonElement idElement)
            || idElement.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        return idElement.GetString();
    }

    private static string? TryReadNestedNetworkInterfaceIpConfigurationId(JsonElement address)
    {
        if (TryGetPropertyIgnoreCase(address, "properties", out JsonElement properties)
            && properties.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(properties, "networkInterfaceIPConfiguration", out JsonElement nestedReference))
        {
            return TryReadNetworkInterfaceIpConfigurationReference(nestedReference);
        }

        if (TryGetPropertyIgnoreCase(address, "networkInterfaceIPConfiguration", out JsonElement flatReference))
        {
            return TryReadNetworkInterfaceIpConfigurationReference(flatReference);
        }

        return null;
    }

    private static string? TryReadNetworkInterfaceIpConfigurationReference(JsonElement reference)
    {
        if (reference.ValueKind is JsonValueKind.String)
        {
            return reference.GetString();
        }

        return TryReadDirectId(reference);
    }

    private static string? TryReadPoolId(JsonElement pool)
    {
        if (TryGetPropertyIgnoreCase(pool, "id", out JsonElement idElement) && idElement.ValueKind is JsonValueKind.String)
        {
            return idElement.GetString();
        }

        return null;
    }

    private static string? TryReadBackendPoolReferenceId(JsonElement poolReference)
    {
        if (poolReference.ValueKind is JsonValueKind.String)
        {
            return poolReference.GetString();
        }

        if (poolReference.ValueKind is JsonValueKind.Object
            && TryGetPropertyIgnoreCase(poolReference, "id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            return idElement.GetString();
        }

        return null;
    }

    private static bool TryGetBackendAddressPoolPropertiesBag(JsonElement pool, out JsonElement poolProperties)
    {
        if (TryGetPropertyIgnoreCase(pool, "properties", out JsonElement nested)
            && nested.ValueKind is JsonValueKind.Object)
        {
            poolProperties = nested;

            return true;
        }

        if (pool.ValueKind is JsonValueKind.Object
            && (TryGetPropertyIgnoreCase(pool, "backendIPConfigurations", out _)
                || TryGetPropertyIgnoreCase(pool, "loadBalancerBackendAddresses", out _)
                || TryGetPropertyIgnoreCase(pool, "backendAddresses", out _)))
        {
            poolProperties = pool;

            return true;
        }

        poolProperties = default;

        return false;
    }

    /// <summary>
    /// Hosted inventory may store each rule as a full ARM resource or as a flattened properties bag only.
    /// </summary>
    private static bool TryGetLoadBalancingRulePropertiesBag(JsonElement rule, out JsonElement ruleProperties)
    {
        if (TryGetPropertyIgnoreCase(rule, "properties", out JsonElement nested)
            && nested.ValueKind is JsonValueKind.Object)
        {
            ruleProperties = nested;

            return true;
        }

        if (rule.ValueKind is JsonValueKind.Object
            && (TryGetPropertyIgnoreCase(rule, "backendPort", out _)
                || TryGetPropertyIgnoreCase(rule, "backendAddressPool", out _)))
        {
            ruleProperties = rule;

            return true;
        }

        ruleProperties = default;

        return false;
    }

    private static int? TryReadBackendPort(JsonElement ruleProperties)
    {
        if (!TryGetPropertyIgnoreCase(ruleProperties, "backendPort", out JsonElement backendPortElement))
        {
            return null;
        }

        if (backendPortElement.ValueKind is JsonValueKind.Number
            && backendPortElement.TryGetInt32(out int backendPort))
        {
            return backendPort;
        }

        if (backendPortElement.ValueKind is JsonValueKind.String
            && int.TryParse(backendPortElement.GetString(), out int parsedPort))
        {
            return parsedPort;
        }

        return null;
    }

    private static bool TryGetPropertyIgnoreCase(
        JsonElement element,
        string propertyName,
        out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {

            if (!property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
