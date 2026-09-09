using System.Text.Json;

namespace ArchLucid.ContextIngestion.Infrastructure;

/// <summary>
///     Shared JSON property walking for infrastructure declaration parsers (DX-42).
/// </summary>
internal static class InfrastructureDeclarationJsonElementReader
{
    internal static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.TryGetProperty(propertyName, out value))
            return true;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }

    internal static void CopyBoundedProperties(JsonElement propertiesObject, Dictionary<string, string> properties)
    {
        List<JsonProperty> allProperties = propertiesObject.EnumerateObject().ToList();

        foreach (JsonProperty property in OrderPropertiesForCopy(allProperties))
            TryCopyBoundedProperty(property, properties);
    }

    internal static bool TryReadPlainScalar(JsonElement value, out string scalar)
    {
        scalar = string.Empty;

        if (value.ValueKind is JsonValueKind.String)
        {
            scalar = (value.GetString() ?? string.Empty).Trim();

            return !string.IsNullOrWhiteSpace(scalar);
        }

        if (value.ValueKind is JsonValueKind.True)
        {
            scalar = "true";

            return true;
        }

        if (value.ValueKind is JsonValueKind.False)
        {
            scalar = "false";

            return true;
        }

        if (value.ValueKind is JsonValueKind.Number)
        {
            scalar = CanonicalInfrastructurePropertyBag.CanonicalizeNumberText(value);

            return !string.IsNullOrWhiteSpace(scalar);
        }

        return false;
    }

    private static IEnumerable<JsonProperty> OrderPropertiesForCopy(IReadOnlyList<JsonProperty> properties)
    {
        foreach (JsonProperty property in properties)
        {
            if (CanonicalInfrastructurePropertyBag.IsSecurityPriorityProperty(property.Name))
                yield return property;
        }

        foreach (JsonProperty property in properties)
        {
            if (!CanonicalInfrastructurePropertyBag.IsSecurityPriorityProperty(property.Name))
                yield return property;
        }
    }

    private static void TryCopyBoundedProperty(JsonProperty property, Dictionary<string, string> properties)
    {
        if (CanonicalInfrastructurePropertyBag.CountTfProperties(properties) >= CanonicalInfrastructurePropertyBag.MaxTfPropertyCount)
            return;

        if (property.Value.ValueKind is JsonValueKind.Array or JsonValueKind.Object)
        {
            if (IsCloudFormationIntrinsic(property.Value))
                return;

            CanonicalInfrastructurePropertyBag.TryAddTfJsonProperty(properties, property.Name, property.Value);
            return;
        }

        if (!TryReadPlainScalar(property.Value, out string valueText))
            return;

        InfrastructureDeclarationSecurityPropertyWriter.TryAddTfPropertyWithArmAlias(
            properties,
            property.Name,
            valueText);
    }

    private static bool IsCloudFormationIntrinsic(JsonElement value)
    {
        if (value.ValueKind is not JsonValueKind.Object)
            return false;

        foreach (JsonProperty intrinsicProperty in value.EnumerateObject())
        {
            if (intrinsicProperty.Name.Equals("Ref", StringComparison.OrdinalIgnoreCase))
                return true;

            if (intrinsicProperty.Name.StartsWith("Fn::", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
