using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Parses normalized <c>logic-app-connections.json</c> companion rows (AX-DE-12).
/// </summary>
public static class AzureInventoryLogicAppConnectionParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryLogicAppConnectionRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Logic App connection row must be a JSON object.";

            return false;
        }

        string? workflowResourceId = TryReadBoundedString(element, "workflowResourceId", MaxIdentifierLength);
        string? workflowName = TryReadBoundedString(element, "workflowName", MaxNameLength);
        string? connectionName = TryReadBoundedString(element, "connectionName", MaxNameLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(workflowResourceId)
            || string.IsNullOrWhiteSpace(workflowName)
            || string.IsNullOrWhiteSpace(connectionName)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "workflowResourceId, workflowName, connectionName, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        row = new AzureInventoryLogicAppConnectionRow
        {
            WorkflowResourceId = workflowResourceId.Trim(),
            WorkflowName = workflowName.Trim(),
            ConnectionName = connectionName.Trim(),
            ConnectionResourceId = TryReadBoundedString(element, "connectionResourceId", MaxIdentifierLength),
            TargetResourceId = TryReadBoundedString(element, "targetResourceId", MaxIdentifierLength),
            TargetHost = TryReadBoundedString(element, "targetHost", MaxNameLength),
            CollectionStatus = collectionStatus.Trim(),
            WarningCode = TryReadBoundedString(element, "warningCode", MaxNameLength),
        };

        return true;
    }

    private static string? TryReadBoundedString(JsonElement element, string propertyName, int maxLength)
    {
        string? value = TryReadString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (trimmed.Length > maxLength)
        {
            trimmed = trimmed[..maxLength];
        }

        return trimmed;
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
