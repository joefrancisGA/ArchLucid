using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>Collects backup and Site Recovery protected items for hosted Recovery Services vaults (RSV-03).</summary>
public static class HostedAzureInventoryRecoveryServicesCollector
{
    public static async Task<IReadOnlyList<AzureInventoryRecoveryServicesProtectedItemRow>> CollectAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<AzureInventoryRecoveryServicesProtectedItemRow> rows = [];

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!string.Equals(
                    resource.ResourceType,
                    AzureInventoryRecoveryServices.VaultResourceType,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            string vaultResourceId = resource.ResourceId.Trim();

            HostedAzureVaultProtectedItemListResult backupResult = await armReadClient
                .ListVaultBackupProtectedItemsAsync(accessToken, vaultResourceId, cancellationToken)
                .ConfigureAwait(false);

            if (!backupResult.Succeeded)
            {
                rows.Add(AzureInventoryRecoveryServicesProtectedItemSanitizer.BuildVaultListFailureRow(
                    vaultResourceId,
                    AzureInventoryRecoveryServices.BackupItemKind,
                    $"{AzureInventoryRecoveryServicesCompletenessWarningCodes.BackupListFailedPrefix}{vaultResourceId}|backup"));
            }
            else
            {
                foreach (JsonElement item in backupResult.Items)
                {
                    if (AzureInventoryRecoveryServicesProtectedItemSanitizer.TrySanitizeBackupItem(
                            vaultResourceId,
                            item,
                            out AzureInventoryRecoveryServicesProtectedItemRow? row)
                        && row is not null)
                    {
                        rows.Add(row);
                    }
                }
            }

            HostedAzureVaultProtectedItemListResult replicationResult = await armReadClient
                .ListVaultReplicationProtectedItemsAsync(accessToken, vaultResourceId, cancellationToken)
                .ConfigureAwait(false);

            if (!replicationResult.Succeeded)
            {
                rows.Add(AzureInventoryRecoveryServicesProtectedItemSanitizer.BuildVaultListFailureRow(
                    vaultResourceId,
                    AzureInventoryRecoveryServices.ReplicationItemKind,
                    $"{AzureInventoryRecoveryServicesCompletenessWarningCodes.SiteRecoveryListFailedPrefix}{vaultResourceId}|siteRecovery"));
            }
            else
            {
                foreach (JsonElement item in replicationResult.Items)
                {
                    if (AzureInventoryRecoveryServicesProtectedItemSanitizer.TrySanitizeReplicationItem(
                            vaultResourceId,
                            item,
                            out AzureInventoryRecoveryServicesProtectedItemRow? row)
                        && row is not null)
                    {
                        rows.Add(row);
                    }
                }
            }
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug(
                "Hosted Azure extractor collected {Count} Recovery Services protected-item rows.",
                rows.Count);
        }

        return rows;
    }
}
