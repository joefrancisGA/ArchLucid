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

        string? targetRegion = TryReadRecoveryTargetRegion(properties);

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

    /// <summary>
    ///     A2A list items publish the current failover region on
    ///     <c>providerSpecificDetails.recoveryFabricLocation</c>.
    ///     <c>initialRecoveryFabricLocation</c> is the original target and stays behind after reprotect.
    /// </summary>
    private static string? TryReadRecoveryTargetRegion(JsonElement properties)
    {
        if (!properties.TryGetProperty("providerSpecificDetails", out JsonElement providerDetails)
            || providerDetails.ValueKind is not JsonValueKind.Object)
        {
            return null;
        }

        string? currentLocation = TryReadString(providerDetails, "recoveryFabricLocation");

        if (!string.IsNullOrWhiteSpace(currentLocation))
        {
            return currentLocation;
        }

        return TryReadString(providerDetails, "initialRecoveryFabricLocation");
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
