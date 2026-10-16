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

        if (explicitRoutes.Count > 0 && ExplicitRoutesSpecifyNextHop(explicitRoutes))
        {
            return explicitRoutes;
        }

        if (!TryGetRoutesJson(properties, out string? routesJson))
        {
            return [];
        }

        return ParseRoutesJson(routesJson!);
    }

    private static bool TryGetRoutesJson(
        IReadOnlyDictionary<string, string> properties,
        out string? routesJson)
    {
        if (properties.TryGetValue("routes", out routesJson) && !string.IsNullOrWhiteSpace(routesJson))
        {
            return true;
        }

        foreach ((string propertyKey, string propertyValue) in properties)
        {

            if (!propertyKey.Equals("routes", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(propertyValue))
            {
                continue;
            }

            routesJson = propertyValue;

            return true;
        }

        routesJson = null;

        return false;
    }

    private static List<AzureInventoryRouteTableRoute> ParseExplicitRouteProperties(
        IReadOnlyDictionary<string, string> properties)
    {
        List<AzureInventoryRouteTableRoute> routes = [];
        HashSet<string> indexes = CollectExplicitRouteIndexes(properties);

        foreach (string index in indexes)
        {
            AzureInventoryRouteTableRoute route = new AzureInventoryRouteTableRoute
            {
                AddressPrefix = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix),
                NextHopType = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix),
                NextHopIpAddress = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix),
                NextHopArmId = ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix),
            };

            if (!RouteHasReachableContent(route))
            {
                continue;
            }

            routes.Add(route);
        }

        return routes;
    }

    private static HashSet<string> CollectExplicitRouteIndexes(IReadOnlyDictionary<string, string> properties)
    {
        HashSet<string> indexes = [];

        foreach (string key in properties.Keys)
        {

            if (!key.StartsWith(InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!TryExtractExplicitRouteIndex(key, out string index))
            {
                continue;
            }

            indexes.Add(index);
        }

        return indexes;
    }

    private static bool TryExtractExplicitRouteIndex(string propertyKey, out string index)
    {
        foreach (string suffix in ExplicitRoutePropertySuffixes)
        {

            if (!propertyKey.EndsWith(suffix, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            index = propertyKey[
                InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix.Length..^suffix.Length];

            return true;
        }

        index = string.Empty;

        return false;
    }

    private static readonly string[] ExplicitRoutePropertySuffixes =
    [
        InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix,
        InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix,
        InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix,
        InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix,
    ];

    private static bool RouteHasReachableContent(AzureInventoryRouteTableRoute route)
    {
        return !string.IsNullOrWhiteSpace(route.AddressPrefix)
               || !string.IsNullOrWhiteSpace(route.NextHopType)
               || !string.IsNullOrWhiteSpace(route.NextHopIpAddress)
               || !string.IsNullOrWhiteSpace(route.NextHopArmId);
    }

    private static bool ExplicitRoutesSpecifyNextHop(IReadOnlyList<AzureInventoryRouteTableRoute> explicitRoutes)
    {
        foreach (AzureInventoryRouteTableRoute route in explicitRoutes)
        {

            if (!string.IsNullOrWhiteSpace(route.NextHopType)
                || !string.IsNullOrWhiteSpace(route.NextHopIpAddress)
                || !string.IsNullOrWhiteSpace(route.NextHopArmId))
            {
                return true;
            }
        }

        return false;
    }

    private static List<AzureInventoryRouteTableRoute> ParseRoutesJson(string routesJson)
    {
        List<AzureInventoryRouteTableRoute> routes = [];

        try
        {
            using JsonDocument document = JsonDocument.Parse(routesJson);
            JsonElement routesRoot = document.RootElement;

            if (routesRoot.ValueKind is JsonValueKind.String)
            {
                string? nestedRoutesJson = routesRoot.GetString();

                if (string.IsNullOrWhiteSpace(nestedRoutesJson))
                {
                    return routes;
                }

                return ParseRoutesJson(nestedRoutesJson);
            }

            if (routesRoot.ValueKind is not JsonValueKind.Array)
            {
                return routes;
            }

            foreach (JsonElement routeElement in routesRoot.EnumerateArray())
            {
                if (!TryResolveRoutePropertiesElement(routeElement, out JsonElement propertiesElement))
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

    private static bool TryResolveRoutePropertiesElement(
        JsonElement routeElement,
        out JsonElement propertiesElement)
    {
        if (routeElement.ValueKind is not JsonValueKind.Object)
        {
            propertiesElement = default;

            return false;
        }

        if (TryGetPropertyIgnoreCase(routeElement, "properties", out JsonElement nestedProperties)
            && nestedProperties.ValueKind is JsonValueKind.Object)
        {
            propertiesElement = nestedProperties;

            return true;
        }

        propertiesElement = routeElement;

        return TryReadString(routeElement, "addressPrefix") is not null
               || TryReadString(routeElement, "nextHopType") is not null
               || TryReadString(routeElement, "nextHopIpAddress") is not null
               || TryReadNestedArmId(routeElement, "nextHop") is not null;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out JsonElement value)
            || value.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        string? parsed = value.GetString();

        return string.IsNullOrWhiteSpace(parsed) ? null : parsed.Trim();
    }

    private static string? TryReadNestedArmId(JsonElement propertiesElement, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(propertiesElement, propertyName, out JsonElement valueElement))
        {
            return null;
        }

        if (valueElement.ValueKind is JsonValueKind.String)
        {
            return NormalizeArmId(valueElement.GetString());
        }

        if (valueElement.ValueKind is JsonValueKind.Object)
        {

            foreach (JsonProperty property in valueElement.EnumerateObject())
            {

                if (!property.Name.Equals("id", StringComparison.OrdinalIgnoreCase)
                    || property.Value.ValueKind is not JsonValueKind.String)
                {
                    continue;
                }

                return NormalizeArmId(property.Value.GetString());
            }
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
