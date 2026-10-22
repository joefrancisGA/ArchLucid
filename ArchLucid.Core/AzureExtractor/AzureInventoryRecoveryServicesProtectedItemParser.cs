using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Parses normalized <c>recovery-services-protected-items.json</c> companion rows (RSV-03).</summary>
public static class AzureInventoryRecoveryServicesProtectedItemParser
{
    private const int MaxIdentifierLength = 512;

    private const int MaxNameLength = 260;

    public static bool TryParse(JsonElement element, out AzureInventoryRecoveryServicesProtectedItemRow? row, out string? errorMessage)
    {
        row = null;
        errorMessage = null;

        if (element.ValueKind is not JsonValueKind.Object)
        {
            errorMessage = "Recovery Services protected-item row must be a JSON object.";

            return false;
        }

        string? vaultResourceId = TryReadBoundedString(element, "vaultResourceId", MaxIdentifierLength);
        string? itemKind = TryReadBoundedString(element, "itemKind", MaxNameLength);
        string? sourceResourceId = TryReadBoundedString(element, "sourceResourceId", MaxIdentifierLength);
        string? collectionStatus = TryReadBoundedString(element, "collectionStatus", MaxNameLength);

        if (string.IsNullOrWhiteSpace(vaultResourceId)
            || string.IsNullOrWhiteSpace(itemKind)
            || string.IsNullOrWhiteSpace(collectionStatus))
        {
            errorMessage = "vaultResourceId, itemKind, and collectionStatus are required.";

            return false;
        }

        if (!AzureInventoryAdfLinkedServiceCollectionStatus.IsValid(collectionStatus))
        {
            errorMessage = $"Unsupported collectionStatus '{collectionStatus}'.";

            return false;
        }

        if (!string.Equals(itemKind, AzureInventoryRecoveryServices.BackupItemKind, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(itemKind, AzureInventoryRecoveryServices.ReplicationItemKind, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = $"Unsupported itemKind '{itemKind}'.";

            return false;
        }

        row = new AzureInventoryRecoveryServicesProtectedItemRow
        {
            VaultResourceId = vaultResourceId.Trim(),
            ItemKind = itemKind.Trim(),
            SourceResourceId = sourceResourceId?.Trim() ?? string.Empty,
            TargetRegion = TryReadBoundedString(element, "targetRegion", MaxNameLength),
            TargetResourceId = TryReadBoundedString(element, "targetResourceId", MaxIdentifierLength),
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
