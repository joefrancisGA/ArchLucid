using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Reads Application Gateway reachability hints from <c>backendAddressPools</c> and
///     <c>frontendIPConfigurations</c> (persisted by
///     <c>HostedAzureInventoryResourcePropertyExpander</c> for application gateways).
/// </summary>
public static class AzureInventoryApplicationGatewayEdgeControlRuleParser
{
    public const string BackendAddressPoolsPropertyKey = "backendAddressPools";

    public const string FrontendIpConfigurationsPropertyKey = "frontendIPConfigurations";

    public static bool HasCollectedRuleBodies(IReadOnlyDictionary<string, string> properties) =>
        properties.ContainsKey(BackendAddressPoolsPropertyKey)
        && !string.IsNullOrWhiteSpace(properties[BackendAddressPoolsPropertyKey])
        && properties.ContainsKey(FrontendIpConfigurationsPropertyKey)
        && !string.IsNullOrWhiteSpace(properties[FrontendIpConfigurationsPropertyKey]);

    public static AzureInventoryNetworkEdgeControlDecision EvaluateBackendExposure(
        IReadOnlyDictionary<string, string> properties,
        string backendAssetArmId)
    {
        if (!HasCollectedRuleBodies(properties))
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        if (!BackendPoolContainsAsset(properties[BackendAddressPoolsPropertyKey], backendAssetArmId))
        {
            return AzureInventoryNetworkEdgeControlDecision.Deny;
        }

        if (!HasPublicFrontend(properties[FrontendIpConfigurationsPropertyKey]))
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        return AzureInventoryNetworkEdgeControlDecision.Allow;
    }

    private static bool BackendPoolContainsAsset(string poolsJson, string backendAssetArmId)
    {
        string normalizedBackend = ArmResourceIdNormalizer.Normalize(backendAssetArmId);

        try
        {
            using JsonDocument document = JsonDocument.Parse(poolsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return false;
            }

            foreach (JsonElement poolElement in document.RootElement.EnumerateArray())
            {
                if (!TryResolvePropertiesElement(poolElement, out JsonElement poolProperties))
                {
                    continue;
                }

                if (!poolProperties.TryGetProperty("backendAddresses", out JsonElement addresses)
                    || addresses.ValueKind is not JsonValueKind.Array)
                {
                    continue;
                }

                foreach (JsonElement addressElement in addresses.EnumerateArray())
                {
                    if (!TryResolvePropertiesElement(addressElement, out JsonElement addressProperties))
                    {
                        continue;
                    }

                    string? fqdn = TryReadString(addressProperties, "fqdn");

                    if (!string.IsNullOrWhiteSpace(fqdn)
                        && normalizedBackend.Contains(fqdn, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    string? ip = TryReadString(addressProperties, "ipAddress");

                    if (!string.IsNullOrWhiteSpace(ip))
                    {
                        continue;
                    }

                    string? backendArmId = TryReadNestedArmId(addressProperties, "backendIpConfiguration");

                    if (!string.IsNullOrWhiteSpace(backendArmId)
                        && (ArmResourceIdNormalizer.IsDescendantOf(backendArmId, normalizedBackend)
                            || ArmResourceIdNormalizer.IsDescendantOf(normalizedBackend, backendArmId)))
                    {
                        return true;
                    }
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static bool HasPublicFrontend(string frontendJson)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(frontendJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return false;
            }

            foreach (JsonElement frontendElement in document.RootElement.EnumerateArray())
            {
                if (!TryResolvePropertiesElement(frontendElement, out JsonElement frontendProperties))
                {
                    continue;
                }

                if (frontendProperties.TryGetProperty("privateIPAddress", out JsonElement privateIp)
                    && privateIp.ValueKind is JsonValueKind.String
                    && !string.IsNullOrWhiteSpace(privateIp.GetString()))
                {
                    continue;
                }

                if (TryReadNestedArmId(frontendProperties, "publicIPAddress") is not null)
                {
                    return true;
                }
            }
        }
        catch (JsonException)
        {
            return false;
        }

        return false;
    }

    private static bool TryResolvePropertiesElement(JsonElement element, out JsonElement propertiesElement)
    {
        if (element.ValueKind is JsonValueKind.Object
            && element.TryGetProperty("properties", out JsonElement nested)
            && nested.ValueKind is JsonValueKind.Object)
        {
            propertiesElement = nested;

            return true;
        }

        if (element.ValueKind is JsonValueKind.Object)
        {
            propertiesElement = element;

            return true;
        }

        propertiesElement = default;

        return false;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value)
            || value.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        return value.GetString();
    }

    private static string? TryReadNestedArmId(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement reference)
            || reference.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        if (reference.TryGetProperty("id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            return idElement.GetString();
        }

        if (reference.TryGetProperty("Id", out JsonElement pascalId)
            && pascalId.ValueKind is JsonValueKind.String)
        {
            return pascalId.GetString();
        }

        return null;
    }
}
