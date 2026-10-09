using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Converts ARM integration runtime payloads into normalized companion rows without secret-bearing fields.
/// </summary>
public static class AzureInventoryAdfIntegrationRuntimeSanitizer
{
    public static bool TrySanitizeFromArmResource(
        string factoryResourceId,
        JsonElement integrationRuntimeResource,
        out AzureInventoryAdfIntegrationRuntimeRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(factoryResourceId)
            || integrationRuntimeResource.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? integrationRuntimeResourceId = TryReadString(integrationRuntimeResource, "id");
        string? name = TryReadString(integrationRuntimeResource, "name");

        if (string.IsNullOrWhiteSpace(integrationRuntimeResourceId) || string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        if (!integrationRuntimeResource.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? kind = TryReadString(propertiesElement, "type");

        if (string.IsNullOrWhiteSpace(kind))
        {
            return false;
        }

        string? state = null;
        string? subnetId = null;

        if (propertiesElement.TryGetProperty("typeProperties", out JsonElement typePropertiesElement)
            && typePropertiesElement.ValueKind is JsonValueKind.Object)
        {
            state = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(typePropertiesElement, "state");
            subnetId = TryReadManagedSubnetId(typePropertiesElement);
        }

        row = new AzureInventoryAdfIntegrationRuntimeRow
        {
            FactoryResourceId = factoryResourceId.Trim(),
            IntegrationRuntimeResourceId = integrationRuntimeResourceId.Trim(),
            Name = name.Trim(),
            Kind = kind.Trim(),
            SubnetId = string.IsNullOrWhiteSpace(subnetId) ? null : subnetId.Trim(),
            State = string.IsNullOrWhiteSpace(state) ? null : state.Trim(),
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    /// <summary>
    /// Data Factory 2018-06-01 puts a managed runtime subnet on
    /// <c>computeProperties.vNetProperties.subnetId</c>. A subnet object directly on
    /// <c>typeProperties</c> is the same field when a payload is already flattened.
    /// </summary>
    private static string? TryReadManagedSubnetId(JsonElement typePropertiesElement)
    {
        if (TryGetObjectProperty(typePropertiesElement, "computeProperties", out JsonElement computeProperties))
        {
            string? nested = TryReadSubnetId(computeProperties);

            if (!string.IsNullOrWhiteSpace(nested))
            {
                return nested;
            }
        }

        return TryReadSubnetId(typePropertiesElement);
    }

    private static string? TryReadSubnetId(JsonElement parent)
    {
        if (!TryGetObjectProperty(parent, "vNetProperties", out JsonElement vnetProperties))
        {
            return null;
        }

        return AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(vnetProperties, "subnetId");
    }

    private static bool TryGetObjectProperty(JsonElement parent, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in parent.EnumerateObject())
        {

            if (!property.Name.Equals(propertyName, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (property.Value.ValueKind is not JsonValueKind.Object)
            {
                value = default;

                return false;
            }

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
