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

            if (typePropertiesElement.TryGetProperty("vnetProperties", out JsonElement vnetPropertiesElement)
                && vnetPropertiesElement.ValueKind is JsonValueKind.Object)
            {
                subnetId = AzureInventoryAdfTypePropertyReader.TryReadAllowedScalar(vnetPropertiesElement, "subnetId");
            }
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

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : value.GetRawText().Trim('"');
    }
}
