using System.Text.Json;

namespace ArchLucid.Core.InfraEvidence;

/// <summary>Resolves built-in Azure role display names from role assignment JSON or role definition ARM ids.</summary>
public static class AzureInventoryBuiltInRoleDefinitionNames
{
    private static readonly Dictionary<string, string> GuidToRoleName =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["8e3af657-a8ff-443c-a75c-2fe8c4bcb635"] = "Owner",
            ["b24988ac-6180-42a0-ab88-20f7382dd24c"] = "Contributor",
            ["acdd72a7-3385-48ef-bd42-f60684581c14"] = "Reader",
            ["2a2b9908-6ea1-4ae2-8e65-a410df84e7dd"] = "Storage Blob Data Reader",
            ["ba92f5b4-2d11-453d-a403-e96e00258736"] = "Storage Blob Data Contributor",
            ["46334506-40de-4032-8ed3-560375d397ba"] = "Key Vault Secrets User",
        };

    public static string? TryResolveFromAssignment(JsonElement assignment, string roleDefinitionId)
    {
        string? explicitName = TryReadString(assignment, "roleDefinitionName")
                               ?? TryReadString(assignment, "roleName");

        if (!string.IsNullOrWhiteSpace(explicitName))
        {
            return explicitName.Trim();
        }

        return TryResolveFromRoleDefinitionId(roleDefinitionId);
    }

    public static string? TryResolveFromRoleDefinitionId(string roleDefinitionId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(roleDefinitionId);

        string normalized = roleDefinitionId.Trim();
        int slashIndex = normalized.LastIndexOf('/');

        if (slashIndex >= 0 && slashIndex < normalized.Length - 1)
        {
            normalized = normalized[(slashIndex + 1)..];
        }

        if (GuidToRoleName.TryGetValue(normalized, out string? roleName))
        {
            return roleName;
        }

        return null;
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
