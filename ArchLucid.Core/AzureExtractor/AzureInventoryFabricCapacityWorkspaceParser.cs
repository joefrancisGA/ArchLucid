using System.Text.Json;

using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Reads workspace assignment rows from Fabric capacity list-workspaces payloads (NR-40).
/// </summary>
public static class AzureInventoryFabricCapacityWorkspaceParser
{
    public static bool TryReadWorkspaceAssignment(
        JsonElement workspaceElement,
        out string? workspaceResourceId,
        out string? workspaceDisplayName)
    {
        workspaceResourceId = null;
        workspaceDisplayName = null;

        if (workspaceElement.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        workspaceDisplayName = TryReadString(workspaceElement, "name")
                               ?? TryReadString(workspaceElement, "displayName");

        string? id = TryReadString(workspaceElement, "id");

        if (!string.IsNullOrWhiteSpace(id)
            && id.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            workspaceResourceId = ArmResourceIdNormalizer.Normalize(id.Trim());

            return true;
        }

        if (!string.IsNullOrWhiteSpace(id))
        {
            workspaceDisplayName = string.IsNullOrWhiteSpace(workspaceDisplayName) ? id.Trim() : workspaceDisplayName;
        }

        return false;
    }

    private static string? TryReadString(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out JsonElement value))
        {
            return null;
        }

        return value.ValueKind is JsonValueKind.String ? value.GetString() : null;
    }
}
