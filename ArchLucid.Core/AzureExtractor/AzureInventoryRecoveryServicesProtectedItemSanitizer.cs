using System.Text.Json;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>Maps ARM backup and Site Recovery protected-item payloads into companion rows (RSV-03).</summary>
public static class AzureInventoryRecoveryServicesProtectedItemSanitizer
{
    public static bool TrySanitizeBackupItem(
        string vaultResourceId,
        JsonElement item,
        out AzureInventoryRecoveryServicesProtectedItemRow? row)
    {
        row = null;

        if (!item.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? sourceResourceId = TryReadString(properties, "sourceResourceId");

        if (string.IsNullOrWhiteSpace(sourceResourceId))
        {
            return false;
        }

        row = new AzureInventoryRecoveryServicesProtectedItemRow
        {
            VaultResourceId = vaultResourceId,
            ItemKind = AzureInventoryRecoveryServices.BackupItemKind,
            SourceResourceId = sourceResourceId.Trim(),
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    public static bool TrySanitizeReplicationItem(
        string vaultResourceId,
        JsonElement item,
        out AzureInventoryRecoveryServicesProtectedItemRow? row)
    {
        row = null;

        if (!item.TryGetProperty("properties", out JsonElement properties)
            || properties.ValueKind is not JsonValueKind.Object)
        {
            return false;
        }

        string? sourceResourceId = TryReadString(properties, "protectableItemId");

        if (string.IsNullOrWhiteSpace(sourceResourceId)
            && properties.TryGetProperty("providerSpecificDetails", out JsonElement providerSpecificDetails)
            && providerSpecificDetails.ValueKind is JsonValueKind.Object)
        {
            sourceResourceId = TryReadString(providerSpecificDetails, "fabricObjectId");
        }

        if (string.IsNullOrWhiteSpace(sourceResourceId))
        {
            return false;
        }

        string? targetRegion = TryReadString(properties, "recoveryFabricFriendlyName");

        if (string.IsNullOrWhiteSpace(targetRegion)
            && properties.TryGetProperty("providerSpecificDetails", out JsonElement providerDetails)
            && providerDetails.ValueKind is JsonValueKind.Object)
        {
            targetRegion = TryReadString(providerDetails, "initialRecoveryFabricLocation");
        }

        string? targetResourceId = TryReadString(properties, "recoveryContainerId");

        row = new AzureInventoryRecoveryServicesProtectedItemRow
        {
            VaultResourceId = vaultResourceId,
            ItemKind = AzureInventoryRecoveryServices.ReplicationItemKind,
            SourceResourceId = sourceResourceId.Trim(),
            TargetRegion = string.IsNullOrWhiteSpace(targetRegion) ? null : targetRegion.Trim(),
            TargetResourceId = string.IsNullOrWhiteSpace(targetResourceId) ? null : targetResourceId.Trim(),
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
        };

        return true;
    }

    public static AzureInventoryRecoveryServicesProtectedItemRow BuildVaultListFailureRow(
        string vaultResourceId,
        string itemKind,
        string warningCode)
    {
        return new AzureInventoryRecoveryServicesProtectedItemRow
        {
            VaultResourceId = vaultResourceId,
            ItemKind = itemKind,
            CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Throttled,
            WarningCode = warningCode,
        };
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
