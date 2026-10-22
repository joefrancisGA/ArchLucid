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
            ["056bdf58-6d9f-44a1-9ea7-69a42ce89f30"] = "SQL DB Contributor",
            ["090c5cfd-751d-490a-894a-3ce6f1109419"] = "Azure Service Bus Data Owner",
            ["4f6d3b9b-027b-4f4c-9142-0e5a2a2247e0"] = "Azure Service Bus Data Receiver",
            ["69a216fc-b8fb-44d8-bc22-1f3c2cd27a39"] = "Azure Service Bus Data Sender",
            ["f526a384-b230-433a-b45c-95f59c4a2dec"] = "Azure Event Hubs Data Owner",
            ["a638d3c7-ab3a-418d-83e6-5f17a39d4fde"] = "Azure Event Hubs Data Receiver",
            ["2b629674-e913-4c01-ae53-ef4638d8f975"] = "Azure Event Hubs Data Sender",
            ["c6a89b2d-59bc-44d0-9896-0f6e12d7b80a"] = "Storage Queue Data Message Sender",
            ["8a0f0c08-91a1-4084-bc3d-661d67233fed"] = "Storage Queue Data Message Processor",
            ["974c5e8b-45b9-4653-ba55-5f855dd0fb88"] = "Storage Queue Data Contributor",
            ["5e0bd9bd-7b93-4f28-af87-19fc36ad61bd"] = "Cognitive Services OpenAI User",
            ["1407120a-92aa-4202-b7e9-c0e197c71c8f"] = "Search Index Data Reader",
            ["8ebe5a00-799e-43f5-93ac-243d3dce84a7"] = "Search Index Data Contributor",
            ["7ca78c08-252a-4471-8644-bb5ff32d4ba0"] = "Search Service Contributor",
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
