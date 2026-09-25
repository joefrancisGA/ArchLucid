using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads user-defined routes from flattened <c>Microsoft.Network/routeTables</c> properties (NR-02).
/// </summary>
public static class AzureInventoryRouteTableRouteParser
{
    public static IReadOnlyList<AzureInventoryRouteTableRoute> Parse(
        IReadOnlyDictionary<string, string> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        List<AzureInventoryRouteTableRoute> explicitRoutes = ParseExplicitRouteProperties(properties);

        if (explicitRoutes.Count > 0)
        {
            return explicitRoutes;
        }

        if (!properties.TryGetValue("routes", out string? routesJson)
            || string.IsNullOrWhiteSpace(routesJson))
        {
            return [];
        }

        return ParseRoutesJson(routesJson);
    }

    private static List<AzureInventoryRouteTableRoute> ParseExplicitRouteProperties(
        IReadOnlyDictionary<string, string> properties)
    {
        List<AzureInventoryRouteTableRoute> routes = [];
        HashSet<string> indexes = [];

        foreach (string key in properties.Keys)
        {
            if (!key.StartsWith(InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix, StringComparison.OrdinalIgnoreCase)
                || !key.EndsWith(
                    InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string index = key[
                InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix.Length..^InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix.Length];

            if (!indexes.Add(index))
            {
                continue;
            }

            routes.Add(new AzureInventoryRouteTableRoute
            {
                AddressPrefix = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix),
                NextHopType = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix),
                NextHopIpAddress = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix),
                NextHopArmId = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix),
            });
        }

        return routes;
    }

    private static List<AzureInventoryRouteTableRoute> ParseRoutesJson(string routesJson)
    {
        List<AzureInventoryRouteTableRoute> routes = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(routesJson);

            if (document.RootElement.ValueKind is not JsonValueKind.Array)
            {
                return routes;
            }

            foreach (JsonElement routeElement in document.RootElement.EnumerateArray())
            {
                if (!routeElement.TryGetProperty("properties", out JsonElement propertiesElement)
                    || propertiesElement.ValueKind is not JsonValueKind.Object)
                {
                    continue;
                }

                routes.Add(new AzureInventoryRouteTableRoute
                {
                    AddressPrefix = TryReadString(propertiesElement, "addressPrefix"),
                    NextHopType = TryReadString(propertiesElement, "nextHopType"),
                    NextHopIpAddress = TryReadString(propertiesElement, "nextHopIpAddress"),
                    NextHopArmId = TryReadNestedArmId(propertiesElement, "nextHop"),
                });
            }
        }
        catch (JsonException)
        {
            return routes;
        }

        return routes;
    }

    private static string? ReadRouteProperty(
        IReadOnlyDictionary<string, string> properties,
        string index,
        string suffix)
    {
        string keyPrefix = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}{index}";

        return ReadFlattenedPropertyValue(properties, keyPrefix, suffix);
    }

    private static string? ReadFlattenedPropertyValue(
        IReadOnlyDictionary<string, string> properties,
        string keyPrefix,
        string suffix)
    {
        string exactKey = $"{keyPrefix}{suffix}";

        if (properties.TryGetValue(exactKey, out string? exactValue) && !string.IsNullOrWhiteSpace(exactValue))
        {
            return exactValue.Trim();
        }

        foreach ((string propertyKey, string propertyValue) in properties)
        {
            if (propertyKey.StartsWith(keyPrefix, StringComparison.OrdinalIgnoreCase)
                && propertyKey.EndsWith(suffix, StringComparison.OrdinalIgnoreCase)
                && !string.IsNullOrWhiteSpace(propertyValue))
            {
                return propertyValue.Trim();
            }
        }

        return null;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value)
            || value.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        string? parsed = value.GetString();

        return string.IsNullOrWhiteSpace(parsed) ? null : parsed.Trim();
    }

    private static string? TryReadNestedArmId(JsonElement propertiesElement, string propertyName)
    {
        if (!propertiesElement.TryGetProperty(propertyName, out JsonElement valueElement))
        {
            return null;
        }

        if (valueElement.ValueKind is JsonValueKind.String)
        {
            return NormalizeArmId(valueElement.GetString());
        }

        if (valueElement.ValueKind is JsonValueKind.Object
            && valueElement.TryGetProperty("id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            return NormalizeArmId(idElement.GetString());
        }

        return null;
    }

    private static string? NormalizeArmId(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId)
            || !armId.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(armId);
    }
}
