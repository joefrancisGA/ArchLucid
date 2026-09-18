using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Integrations.AzureExtractor;

internal static class HostedAzureArmSystemDataPropertyCapture
{
    public static void Capture(JsonElement item, IDictionary<string, object?> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!item.TryGetProperty("systemData", out JsonElement systemData)
            || systemData.ValueKind is not JsonValueKind.Object)
        {
            return;
        }

        AddStringProperty(systemData, "createdBy", AzureInventorySystemDataPropertyKeys.CreatedBy, properties);
        AddStringProperty(systemData, "createdByType", AzureInventorySystemDataPropertyKeys.CreatedByType, properties);
        AddStringProperty(systemData, "lastModifiedBy", AzureInventorySystemDataPropertyKeys.LastModifiedBy, properties);
        AddStringProperty(
            systemData,
            "lastModifiedByType",
            AzureInventorySystemDataPropertyKeys.LastModifiedByType,
            properties);
    }

    public static void CaptureVirtualMachineComputerName(
        string resourceType,
        JsonElement propertiesElement,
        IDictionary<string, object?> properties)
    {
        ArgumentNullException.ThrowIfNull(properties);

        if (!resourceType.Contains("virtualMachines", StringComparison.OrdinalIgnoreCase)
            || propertiesElement.ValueKind is not JsonValueKind.Object
            || !propertiesElement.TryGetProperty("osProfile", out JsonElement osProfile)
            || osProfile.ValueKind is not JsonValueKind.Object
            || !osProfile.TryGetProperty("computerName", out JsonElement computerNameElement)
            || computerNameElement.ValueKind is not JsonValueKind.String)
        {
            return;
        }

        string? computerName = computerNameElement.GetString();

        if (string.IsNullOrWhiteSpace(computerName))
        {
            return;
        }

        properties[AzureInventorySystemDataPropertyKeys.ComputerName] = computerName.Trim();
    }

    private static void AddStringProperty(
        JsonElement source,
        string jsonPropertyName,
        string propertyKey,
        IDictionary<string, object?> properties)
    {
        if (!source.TryGetProperty(jsonPropertyName, out JsonElement valueElement)
            || valueElement.ValueKind is not JsonValueKind.String)
        {
            return;
        }

        string? value = valueElement.GetString();

        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        properties[propertyKey] = value.Trim();
    }
}
