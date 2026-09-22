using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects SQL, Cosmos, and storage child resources for hosted Tier 2 packages (AX-DE-14).
/// </summary>
public static class HostedAzureInventoryPaasChildCollector
{
    private const int MaxStorageChildrenPerAccount = 200;

    private const string SqlApiVersion = "2021-11-01";

    private const string CosmosApiVersion = "2023-04-15";

    private const string StorageApiVersion = "2023-01-01";

    public static async Task<HostedAzureInventoryPaasChildCollectResult> CollectAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<AzureInventoryPaasChildAssociationRow> rows = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);
        List<string> collectionWarnings = [];

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase))
            {
                await CollectSqlDatabasesAsync(
                    armReadClient,
                    accessToken,
                    resource.ResourceId.Trim(),
                    rows,
                    seenKeys,
                    logger,
                    cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.DocumentDB/databaseAccounts", StringComparison.OrdinalIgnoreCase))
            {
                await CollectCosmosDatabasesAsync(
                    armReadClient,
                    accessToken,
                    resource.ResourceId.Trim(),
                    rows,
                    seenKeys,
                    logger,
                    cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase))
            {
                bool truncated = await CollectStorageChildrenAsync(
                    armReadClient,
                    accessToken,
                    resource.ResourceId.Trim(),
                    rows,
                    seenKeys,
                    logger,
                    cancellationToken).ConfigureAwait(false);

                if (truncated)
                {
                    collectionWarnings.Add(AzureInventoryPaasChildCompletenessWarningCodes.StorageChildrenTruncated);
                }
            }
        }

        return new HostedAzureInventoryPaasChildCollectResult
        {
            Associations = rows,
            CollectionWarnings = collectionWarnings,
        };
    }

    private static async Task CollectSqlDatabasesAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string serverResourceId,
        List<AzureInventoryPaasChildAssociationRow> rows,
        HashSet<string> seenKeys,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<JsonElement> databases = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                serverResourceId,
                "databases",
                SqlApiVersion,
                "SQL database",
                cancellationToken).ConfigureAwait(false);

            foreach (JsonElement database in databases)
            {
                if (!AzureInventoryPaasChildAssociationExtractor.TryExtractChild(
                        serverResourceId,
                        database,
                        AzureInventoryPaasChildAssociationTypes.SqlDatabase,
                        out AzureInventoryPaasChildAssociationRow? row)
                    || row is null)
                {
                    continue;
                }

                if (AzureInventoryNeverShowSqlDatabaseNames.ShouldOmit(
                        resourceType: null,
                        row.ChildResourceId,
                        row.ChildName))
                {
                    continue;
                }

                AddRow(row, rows, seenKeys);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug(
                    ex,
                    "Hosted Azure extractor skipped SQL databases for server {ServerId}.",
                    serverResourceId);
            }
        }
    }

    private static async Task CollectCosmosDatabasesAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string accountResourceId,
        List<AzureInventoryPaasChildAssociationRow> rows,
        HashSet<string> seenKeys,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<JsonElement> databases = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                accountResourceId,
                "sqlDatabases",
                CosmosApiVersion,
                "Cosmos SQL database",
                cancellationToken).ConfigureAwait(false);

            foreach (JsonElement database in databases)
            {
                if (!AzureInventoryPaasChildAssociationExtractor.TryExtractChild(
                        accountResourceId,
                        database,
                        AzureInventoryPaasChildAssociationTypes.CosmosDatabase,
                        out AzureInventoryPaasChildAssociationRow? row)
                    || row is null)
                {
                    continue;
                }

                AddRow(row, rows, seenKeys);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug(
                    ex,
                    "Hosted Azure extractor skipped Cosmos databases for account {AccountId}.",
                    accountResourceId);
            }
        }
    }

    private static async Task<bool> CollectStorageChildrenAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string storageAccountResourceId,
        List<AzureInventoryPaasChildAssociationRow> rows,
        HashSet<string> seenKeys,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        bool truncated = false;

        try
        {
            string blobServiceResourceId = $"{storageAccountResourceId.Trim()}/blobServices/default";

            IReadOnlyList<JsonElement> containers = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                blobServiceResourceId,
                "containers",
                StorageApiVersion,
                "Storage blob container",
                cancellationToken).ConfigureAwait(false);

            int count = 0;

            foreach (JsonElement container in containers)
            {
                if (count >= MaxStorageChildrenPerAccount)
                {
                    truncated = true;
                    break;
                }

                if (!AzureInventoryPaasChildAssociationExtractor.TryExtractChild(
                        storageAccountResourceId,
                        container,
                        AzureInventoryPaasChildAssociationTypes.StorageBlobContainer,
                        out AzureInventoryPaasChildAssociationRow? row)
                    || row is null)
                {
                    continue;
                }

                AddRow(row, rows, seenKeys);
                count++;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug(
                    ex,
                    "Hosted Azure extractor skipped storage containers for account {AccountId}.",
                    storageAccountResourceId);
            }
        }

        return truncated;
    }

    private static void AddRow(
        AzureInventoryPaasChildAssociationRow row,
        List<AzureInventoryPaasChildAssociationRow> rows,
        HashSet<string> seenKeys)
    {
        string key = $"{row.ParentResourceId}|{row.ChildResourceId}|{row.ChildType}";

        if (seenKeys.Add(key))
        {
            rows.Add(row);
        }
    }
}

public sealed class HostedAzureInventoryPaasChildCollectResult
{
    public IReadOnlyList<AzureInventoryPaasChildAssociationRow> Associations
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> CollectionWarnings
    {
        get;
        init;
    } = [];
}
