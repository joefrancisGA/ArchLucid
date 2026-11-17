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
                NextHopIpAddress = ReadRouteNextHopIpAddress(properties, index),
                NextHopArmId = TryParseFlattenedNextHopArmId(properties, index),
            };

            if (!RouteHasReachableContent(route)
                && TryParseRouteFromFlattenedRowBlob(properties, index, out AzureInventoryRouteTableRoute blobRoute))
            {
                route = blobRoute;
            }

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

            if (TryExtractExplicitRouteIndex(key, out string index))
            {
                indexes.Add(index);

                continue;
            }

            string routeRowKeySuffix = key[InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix.Length..];

            if (!string.IsNullOrEmpty(routeRowKeySuffix) && !routeRowKeySuffix.Contains('.'))
            {
                indexes.Add(routeRowKeySuffix);
            }
        }

        return indexes;
    }

    private static bool TryParseRouteFromFlattenedRowBlob(
        IReadOnlyDictionary<string, string> properties,
        string index,
        out AzureInventoryRouteTableRoute route)
    {
        route = new AzureInventoryRouteTableRoute();

        string rowKey = $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}{index}";

        if (!TryReadPropertyValueIgnoreCase(properties, rowKey, out string? rowJson)
            || string.IsNullOrWhiteSpace(rowJson))
        {
            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(rowJson);

            if (!TryParseRouteFromRouteElement(document.RootElement, out route))
            {
                return false;
            }

            return RouteHasReachableContent(route);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool TryReadPropertyValueIgnoreCase(
        IReadOnlyDictionary<string, string> properties,
        string propertyKey,
        out string? value)
    {
        if (properties.TryGetValue(propertyKey, out value) && !string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        foreach ((string key, string propertyValue) in properties)
        {

            if (!key.Equals(propertyKey, StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(propertyValue))
            {
                continue;
            }

            value = propertyValue;

            return true;
        }

        value = null;

        return false;
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
        InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix,
    ];

    private static string? TryParseFlattenedNextHopArmId(
        IReadOnlyDictionary<string, string> properties,
        string index)
    {
        string? fromArmIdSuffix = TryParseFlattenedArmIdValue(
            ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopArmIdSuffix));

        if (!string.IsNullOrWhiteSpace(fromArmIdSuffix))
        {
            return fromArmIdSuffix;
        }

        return TryParseFlattenedArmIdValue(
            ReadRouteProperty(properties, index, InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix));
    }

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

                if (!TryParseRouteFromRouteElement(routeElement, out AzureInventoryRouteTableRoute route)
                    || !RouteHasReachableContent(route))
                {
                    continue;
                }

                routes.Add(route);
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

    private static string? ReadRouteNextHopIpAddress(IReadOnlyDictionary<string, string> properties, string index)
    {
        string? raw = ReadRouteProperty(
            properties,
            index,
            InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix);

        if (string.IsNullOrWhiteSpace(raw))
        {
            string? referenceRaw = ReadRouteProperty(
                properties,
                index,
                InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopReferenceSuffix);

            if (string.IsNullOrWhiteSpace(referenceRaw)
                || !string.IsNullOrWhiteSpace(TryParseFlattenedArmIdValue(referenceRaw)))
            {
                return null;
            }

            raw = referenceRaw;
        }

        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return ResolveNextHopIpAddressScalar(raw);
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

    private static bool TryParseRouteFromRouteElement(JsonElement routeElement, out AzureInventoryRouteTableRoute route)
    {
        route = new AzureInventoryRouteTableRoute();

        if (routeElement.ValueKind is JsonValueKind.String)
        {
            string? nestedRouteJson = routeElement.GetString();

            if (string.IsNullOrWhiteSpace(nestedRouteJson))
            {
                return false;
            }

            try
            {
                using JsonDocument nestedDocument = JsonDocument.Parse(nestedRouteJson);

                return TryParseRouteFromRouteElement(nestedDocument.RootElement, out route);
            }
            catch (JsonException)
            {
                return false;
            }
        }

        if (!TryResolveRoutePropertiesElement(routeElement, out JsonElement propertiesElement))
        {
            return false;
        }

        route = new AzureInventoryRouteTableRoute
        {
            AddressPrefix = TryReadString(propertiesElement, "addressPrefix"),
            NextHopType = TryReadString(propertiesElement, "nextHopType"),
            NextHopIpAddress = TryReadNextHopIpAddress(propertiesElement, "nextHopIpAddress")
                ?? TryReadNestedNextHopIpAddressWhenNotArmId(propertiesElement, "nextHop")
                ?? TryReadNestedNextHopIpAddressWhenNotArmId(propertiesElement, "nextHopReference"),
            NextHopArmId = TryReadNestedArmId(propertiesElement, "nextHop")
                ?? TryReadNestedArmId(propertiesElement, "nextHopArmId")
                ?? TryReadNestedArmId(propertiesElement, "nextHopReference"),
        };

        return true;
    }

    private static string? TryReadNestedNextHopIpAddressWhenNotArmId(JsonElement propertiesElement, string propertyName)
    {
        if (TryReadNestedArmId(propertiesElement, propertyName) is not null)
        {
            return null;
        }

        return TryReadNextHopIpAddress(propertiesElement, propertyName);
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

    private static string? TryReadNextHopIpAddress(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out JsonElement value))
        {
            return null;
        }

        if (AzureExtractorJsonObjectElement.TryUnwrapObject(value, out JsonElement objectReference))
        {
            return TryReadArmIdFromReferenceObject(objectReference);
        }

        if (value.ValueKind is JsonValueKind.Object)
        {
            return TryReadArmIdFromReferenceObject(value);
        }

        if (value.ValueKind is not JsonValueKind.String)
        {
            return null;
        }

        string? parsed = value.GetString();

        if (string.IsNullOrWhiteSpace(parsed))
        {
            return null;
        }

        return ResolveNextHopIpAddressScalar(parsed);
    }

    private static string? ResolveNextHopIpAddressScalar(string raw)
    {
        string working = UnwrapJsonStringScalarIfPresent(raw.Trim());

        string? normalized = TryParseFlattenedArmIdValue(working);

        if (!string.IsNullOrWhiteSpace(normalized))
        {
            return normalized;
        }

        string decoded = UnwrapJsonStringScalarIfPresent(PercentDecodeUntilStable(working));
        normalized = TryParseFlattenedArmIdValue(decoded);

        if (!string.IsNullOrWhiteSpace(normalized))
        {
            return normalized;
        }

        string? fromReferenceJson = TryReadLiteralScalarFromReferenceJson(decoded);

        return fromReferenceJson ?? decoded;
    }

    private static string UnwrapJsonStringScalarIfPresent(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text[0] != '"')
        {
            return text;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(text);

            if (document.RootElement.ValueKind is JsonValueKind.String)
            {
                string? inner = document.RootElement.GetString();

                if (!string.IsNullOrWhiteSpace(inner))
                {
                    return inner.Trim();
                }
            }
        }
        catch (JsonException)
        {
        }

        return text;
    }

    private static string? TryReadLiteralScalarFromReferenceJson(string text)
    {
        if (!text.StartsWith("{", StringComparison.Ordinal))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(text);
            JsonElement root = document.RootElement;

            if (root.ValueKind is not JsonValueKind.Object)
            {
                return null;
            }

            string? fromId = TryReadStringPropertyIgnoreCase(root, "id");

            if (!string.IsNullOrWhiteSpace(fromId))
            {
                return fromId.Trim();
            }

            string? fromResourceId = TryReadStringPropertyIgnoreCase(root, "resourceId");

            if (!string.IsNullOrWhiteSpace(fromResourceId))
            {
                return fromResourceId.Trim();
            }
        }
        catch (JsonException)
        {
        }

        return null;
    }

    private static string? TryReadStringPropertyIgnoreCase(JsonElement element, string propertyName)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase)
                || property.Value.ValueKind is not JsonValueKind.String)
            {
                continue;
            }

            return property.Value.GetString();
        }

        return null;
    }

    private static string? TryParseFlattenedArmIdValue(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return null;
        }

        string trimmed = rawValue.Trim();
        trimmed = PercentDecodeUntilStable(trimmed);

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);
            JsonElement root = document.RootElement;

            if (AzureExtractorJsonObjectElement.TryUnwrapObject(root, out JsonElement objectReference))
            {
                string? fromObject = TryReadArmIdFromReferenceObject(objectReference);

                if (!string.IsNullOrWhiteSpace(fromObject))
                {
                    return fromObject;
                }
            }

            if (root.ValueKind is JsonValueKind.String)
            {
                return NormalizeArmId(root.GetString());
            }
        }
        catch (JsonException)
        {
        }

        return NormalizeArmId(trimmed);
    }

    private static string? TryReadNestedArmId(JsonElement propertiesElement, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(propertiesElement, propertyName, out JsonElement valueElement))
        {
            return null;
        }

        if (AzureExtractorJsonObjectElement.TryUnwrapObject(valueElement, out JsonElement objectReference))
        {
            return TryReadArmIdFromReferenceObject(objectReference);
        }

        if (valueElement.ValueKind is JsonValueKind.String)
        {
            return TryParseFlattenedArmIdValue(valueElement.GetString());
        }

        if (valueElement.ValueKind is JsonValueKind.Object)
        {
            return TryReadArmIdFromReferenceObject(valueElement);
        }

        return null;
    }

    private static string? TryReadArmIdFromReferenceObject(JsonElement referenceObject)
    {
        string? fromId = TryReadArmIdFromReferenceProperty(referenceObject, "id");

        if (!string.IsNullOrWhiteSpace(fromId))
        {
            return fromId;
        }

        return TryReadArmIdFromReferenceProperty(referenceObject, "resourceId");
    }

    private static string? TryReadArmIdFromReferenceProperty(JsonElement referenceObject, string propertyName)
    {
        foreach (JsonProperty property in referenceObject.EnumerateObject())
        {
            if (!property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase)
                || property.Value.ValueKind is not JsonValueKind.String)
            {
                continue;
            }

            string? armId = property.Value.GetString();

            if (string.IsNullOrWhiteSpace(armId))
            {
                return null;
            }

            return NormalizeArmId(UnwrapJsonEncodedArmId(armId));
        }

        return null;
    }

    private static string PercentDecodeUntilStable(string trimmed)
    {
        string working = trimmed;

        for (int pass = 0; pass < 8 && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(working);

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                break;
            }

            working = decoded;
        }

        return working;
    }

    private static string UnwrapJsonEncodedArmId(string armId)
    {
        string trimmed = armId.Trim();

        if (trimmed.Length >= 2 && trimmed[0] == '"' && trimmed[^1] == '"')
        {
            return trimmed[1..^1].Trim();
        }

        return trimmed;
    }

    private static string? NormalizeArmId(string? armId)
    {
        if (string.IsNullOrWhiteSpace(armId))
        {
            return null;
        }

        string? normalized = AzureInventoryArmNestedObjectPropertyReader.TryNormalizeSubscriptionArmPathScalar(armId);

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return ArmResourceIdNormalizer.Normalize(normalized);
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
