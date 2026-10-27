using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     ARM list/get payloads often place scalar fields on an object directly (flat) or under a nested
///     <c>properties</c> bag. Inventory extractors must accept both shapes when reading child ARM objects.
/// </summary>
public static class AzureInventoryArmNestedObjectPropertyReader
{
    private const int MaxSubscriptionArmPercentDecodePasses = 8;

    public static JsonElement ResolvePropertyBag(JsonElement armObject)
    {
        if (armObject.ValueKind is JsonValueKind.Object
            && armObject.TryGetProperty("properties", out JsonElement nestedProperties)
            && nestedProperties.ValueKind is JsonValueKind.Object)
        {
            return nestedProperties;
        }

        return armObject;
    }

    public static string? TryReadString(JsonElement armObject, string propertyName)
    {
        if (armObject.TryGetProperty("properties", out JsonElement nestedProperties)
            && nestedProperties.ValueKind is JsonValueKind.Object)
        {
            string? fromNested = TryReadStringDirect(nestedProperties, propertyName);

            if (!string.IsNullOrWhiteSpace(fromNested))
            {
                return fromNested;
            }
        }

        return TryReadStringDirect(armObject, propertyName);
    }

    private static string? TryReadStringDirect(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return TryReadScalarString(value);
    }

    public static string? TryReadScalarString(JsonElement value)
    {
        if (value.ValueKind is JsonValueKind.String)
        {
            string? text = value.GetString();

            if (string.IsNullOrWhiteSpace(text))
            {
                return null;
            }

            string trimmed = text.Trim();

            if (trimmed.StartsWith("{", StringComparison.Ordinal))
            {
                return TryResolveArmReferenceScalar(trimmed);
            }

            string? fromPercentEncodedReference = TryResolveArmReferenceScalarAfterPercentDecode(trimmed);

            if (!string.IsNullOrWhiteSpace(fromPercentEncodedReference))
            {
                return fromPercentEncodedReference;
            }

            string? normalized = TryNormalizePlainArmStringScalar(trimmed);

            return normalized ?? text;
        }

        if (value.ValueKind is JsonValueKind.Object)
        {
            return TryReadArmIdFromReferenceObject(value);
        }

        return value.GetRawText().Trim('"');
    }

    private static string? TryResolveArmReferenceScalarAfterPercentDecode(string trimmed)
    {
        string working = trimmed;

        for (int pass = 0; pass < MaxSubscriptionArmPercentDecodePasses && working.Contains('%', StringComparison.Ordinal); pass++)
        {
            string decoded = Uri.UnescapeDataString(working);

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                break;
            }

            working = decoded;

            if (working.StartsWith("{", StringComparison.Ordinal))
            {
                string? armId = TryResolveArmReferenceScalar(working);

                if (!string.IsNullOrWhiteSpace(armId))
                {
                    return armId;
                }
            }
        }

        return null;
    }

    private static string? TryResolveArmReferenceScalar(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        string trimmed = text.Trim();

        if (!trimmed.StartsWith("{", StringComparison.Ordinal))
        {
            return null;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);
            JsonElement root = document.RootElement;

            if (root.ValueKind is JsonValueKind.Object)
            {
                return TryReadArmIdFromReferenceObject(root);
            }
        }
        catch (JsonException)
        {
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

            return TryNormalizePlainArmStringScalar(armId);
        }

        return null;
    }

    public static string? TryNormalizeSubscriptionArmPathScalar(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return TryNormalizePlainArmStringScalar(value.Trim());
    }

    private static string? TryNormalizePlainArmStringScalar(string trimmed)
    {
        string working = UnwrapJsonEncodedArmId(trimmed);

        for (int pass = 0; pass < MaxSubscriptionArmPercentDecodePasses; pass++)
        {
            working = UnwrapJsonEncodedArmId(working);

            if (working.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
            {
                return FinishDecodedSubscriptionArmPath(working);
            }

            if (!working.Contains('%', StringComparison.Ordinal))
            {
                return null;
            }

            string decoded = Uri.UnescapeDataString(working);

            if (string.Equals(decoded, working, StringComparison.Ordinal))
            {
                return null;
            }

            working = decoded;
        }

        working = UnwrapJsonEncodedArmId(working);

        if (!working.Contains("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return FinishDecodedSubscriptionArmPath(working);
    }

    /// <summary>
    ///     Strip one trailing slash so encoded <c>/rg/</c> joins the same resource as <c>/rg</c>.
    ///     Do not lowercase: inventory extractors preserve Azure's original ARM id casing.
    ///     Join-time lowercase lives in <c>ArmResourceIdNormalizer</c>.
    /// </summary>
    private static string? FinishDecodedSubscriptionArmPath(string armPath)
    {
        string trimmed = armPath.Trim();

        if (trimmed.EndsWith('/'))
        {
            trimmed = trimmed[..^1];
        }

        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
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
}
