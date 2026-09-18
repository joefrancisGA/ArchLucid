using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses AVD session host ARM payloads into <c>network-associations.json</c> rows.
/// </summary>
public static class AzureInventoryAvdSessionHostAssociationExtractor
{
    public static bool TryExtractFromSessionHostId(
        string sessionHostResourceId,
        string virtualMachineResourceId,
        out AzureInventoryAvdSessionHostAssociationRow? row)
    {
        row = null;

        if (string.IsNullOrWhiteSpace(sessionHostResourceId)
            || string.IsNullOrWhiteSpace(virtualMachineResourceId))
        {
            return false;
        }

        if (!sessionHostResourceId.Contains(
                "Microsoft.DesktopVirtualization/hostPools/",
                StringComparison.OrdinalIgnoreCase)
            || !sessionHostResourceId.Contains("/sessionHosts/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!virtualMachineResourceId.Contains(
                "Microsoft.Compute/virtualMachines/",
                StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        row = new AzureInventoryAvdSessionHostAssociationRow
        {
            SessionHostResourceId = sessionHostResourceId.Trim(),
            VirtualMachineResourceId = virtualMachineResourceId.Trim(),
        };

        return true;
    }

    public static bool TryExtractFromJsonElement(
        JsonElement sessionHostElement,
        out AzureInventoryAvdSessionHostAssociationRow? row)
    {
        row = null;

        if (!TryReadStringProperty(sessionHostElement, "id", out string? sessionHostResourceId)
            || string.IsNullOrWhiteSpace(sessionHostResourceId))
        {
            return false;
        }

        string? virtualMachineResourceId = TryReadVirtualMachineResourceId(sessionHostElement);

        if (string.IsNullOrWhiteSpace(virtualMachineResourceId))
        {
            return false;
        }

        return TryExtractFromSessionHostId(sessionHostResourceId, virtualMachineResourceId, out row);
    }

    private static string? TryReadVirtualMachineResourceId(JsonElement sessionHostElement)
    {
        if (sessionHostElement.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind is JsonValueKind.Object
            && TryReadStringProperty(propertiesElement, "resourceId", out string? resourceId)
            && !string.IsNullOrWhiteSpace(resourceId))
        {
            return resourceId;
        }

        if (TryReadStringProperty(sessionHostElement, "vmResourceId", out string? vmResourceId)
            && !string.IsNullOrWhiteSpace(vmResourceId))
        {
            return vmResourceId;
        }

        return null;
    }

    private static bool TryReadStringProperty(JsonElement element, string propertyName, out string? value)
    {
        value = null;

        if (!element.TryGetProperty(propertyName, out JsonElement propertyElement)
            || propertyElement.ValueKind is not JsonValueKind.String)
        {
            return false;
        }

        value = propertyElement.GetString();

        return !string.IsNullOrWhiteSpace(value);
    }
}
