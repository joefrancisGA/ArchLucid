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
        List<BackendTarget> targets = [];

        if (!loadBalancerNode.Properties.TryGetValue("backendAddressPools", out string? poolsJson)
            || string.IsNullOrWhiteSpace(poolsJson))
        {
            return targets;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(poolsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return targets;
            }

            foreach (JsonElement pool in document.RootElement.EnumerateArray())
            {
                string? poolId = TryReadPoolId(pool);
                int? rulePort = null;

                if (!string.IsNullOrWhiteSpace(poolId))
                {
                    portByPoolId.TryGetValue(ArmResourceIdNormalizer.Normalize(poolId), out rulePort);
                }

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

                    string? backendArmId = AzureInventoryPublicIpConfigurationParentResolver.TryResolveParentArmId(
                        ipConfigurationId);

                    if (string.IsNullOrWhiteSpace(backendArmId))
                    {
                        continue;
                    }

                    targets.Add(new BackendTarget(ArmResourceIdNormalizer.Normalize(backendArmId), rulePort));
                }
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

        List<BackendTarget> targets = [];

        if (!applicationGatewayNode.Properties.TryGetValue("backendAddressPools", out string? poolsJson)
            || string.IsNullOrWhiteSpace(poolsJson))
        {
            return targets;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(poolsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return targets;
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
                    string? backendArmId = TryReadApplicationGatewayBackendArmId(address);

                    if (string.IsNullOrWhiteSpace(backendArmId))
                    {
                        continue;
                    }

                    targets.Add(new BackendTarget(ArmResourceIdNormalizer.Normalize(backendArmId), null));
                }
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

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return portByPoolId;
            }

            foreach (JsonElement rule in document.RootElement.EnumerateArray())
            {
                if (!rule.TryGetProperty("properties", out JsonElement ruleProperties)
                    || ruleProperties.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                if (!ruleProperties.TryGetProperty("backendAddressPool", out JsonElement poolReference))
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

    private static string? TryReadPoolId(JsonElement pool)
    {
        if (pool.TryGetProperty("id", out JsonElement idElement) && idElement.ValueKind is JsonValueKind.String)
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
            && poolReference.TryGetProperty("id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            return idElement.GetString();
        }

        return null;
    }

    private static int? TryReadBackendPort(JsonElement ruleProperties)
    {
        if (!ruleProperties.TryGetProperty("backendPort", out JsonElement backendPortElement))
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

    private static string? TryReadApplicationGatewayBackendArmId(JsonElement address)
    {
        if (!address.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (properties.TryGetProperty("backendIpAddress", out JsonElement ipElement)
            && ipElement.ValueKind is JsonValueKind.String
            && !string.IsNullOrWhiteSpace(ipElement.GetString()))
        {
            return null;
        }

        if (properties.TryGetProperty("backendResourceId", out JsonElement resourceIdElement)
            && resourceIdElement.ValueKind is JsonValueKind.String)
        {
            return resourceIdElement.GetString();
        }

        return null;
    }
}
