using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Reads Front Door / CDN profile reachability hints from <c>originGroups</c> (persisted by
///     <c>HostedAzureInventoryResourcePropertyExpander.AddFrontDoorProperties</c>).
/// </summary>
public static class AzureInventoryFrontDoorEdgeControlRuleParser
{
    public const string OriginGroupsPropertyKey = "originGroups";

    public static bool HasCollectedRuleBodies(IReadOnlyDictionary<string, string> properties) =>
        properties.ContainsKey(OriginGroupsPropertyKey)
        && !string.IsNullOrWhiteSpace(properties[OriginGroupsPropertyKey]);

    public static AzureInventoryNetworkEdgeControlDecision EvaluateOriginExposure(
        IReadOnlyDictionary<string, string> properties,
        string backendAssetArmId)
    {
        if (!HasCollectedRuleBodies(properties))
        {
            return AzureInventoryNetworkEdgeControlDecision.Unknown;
        }

        if (!OriginGroupContainsAsset(properties[OriginGroupsPropertyKey], backendAssetArmId))
        {
            return AzureInventoryNetworkEdgeControlDecision.Deny;
        }

        return AzureInventoryNetworkEdgeControlDecision.Allow;
    }

    private static bool OriginGroupContainsAsset(string originGroupsJson, string backendAssetArmId)
    {
        string normalizedBackend = ArmResourceIdNormalizer.Normalize(backendAssetArmId);

        try
        {
            using JsonDocument document = JsonDocument.Parse(originGroupsJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return false;
            }

            foreach (JsonElement groupElement in document.RootElement.EnumerateArray())
            {
                if (!TryResolvePropertiesElement(groupElement, out JsonElement groupProperties))
                {
                    continue;
                }

                if (!groupProperties.TryGetProperty("origins", out JsonElement origins)
                    || origins.ValueKind is not JsonValueKind.Array)
                {
                    continue;
                }

                foreach (JsonElement originElement in origins.EnumerateArray())
                {
                    if (!TryResolvePropertiesElement(originElement, out JsonElement originProperties))
                    {
                        continue;
                    }

                    string? hostName = TryReadString(originProperties, "hostName");

                    if (!string.IsNullOrWhiteSpace(hostName)
                        && normalizedBackend.Contains(hostName, StringComparison.OrdinalIgnoreCase))
                    {
                        return true;
                    }

                    string? originHost = TryReadString(originProperties, "originHostHeader");

                    if (!string.IsNullOrWhiteSpace(originHost)
                        && normalizedBackend.Contains(originHost, StringComparison.OrdinalIgnoreCase))
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
}
