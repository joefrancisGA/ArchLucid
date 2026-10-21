using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects Event Hub and Service Bus child resources for hosted Tier 2 packages (AX-DE-13).
/// </summary>
public static class HostedAzureInventoryMessagingAssociationCollector
{
    private const string EventHubApiVersion = "2021-11-01";

    private const string ServiceBusApiVersion = "2021-11-01";

    public static async Task<HostedAzureInventoryMessagingAssociationCollectResult> CollectAsync(
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

        List<AzureInventoryMessagingAssociationRow> rows = [];
        List<string> collectionWarnings = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.EventHub/namespaces", StringComparison.OrdinalIgnoreCase))
            {
                await CollectEventHubChildrenAsync(
                    armReadClient,
                    accessToken,
                    resource.ResourceId.Trim(),
                    rows,
                    seenKeys,
                    collectionWarnings,
                    logger,
                    cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.ServiceBus/namespaces", StringComparison.OrdinalIgnoreCase))
            {
                await CollectServiceBusChildrenAsync(
                    armReadClient,
                    accessToken,
                    resource.ResourceId.Trim(),
                    rows,
                    seenKeys,
                    collectionWarnings,
                    logger,
                    cancellationToken).ConfigureAwait(false);
            }
        }

        return new HostedAzureInventoryMessagingAssociationCollectResult
        {
            Associations = rows,
            CollectionWarnings = collectionWarnings,
        };
    }

    private static async Task CollectEventHubChildrenAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string namespaceResourceId,
        List<AzureInventoryMessagingAssociationRow> rows,
        HashSet<string> seenKeys,
        List<string> collectionWarnings,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            HostedAzureArmChildCollectionReadResult listResult = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                namespaceResourceId,
                "eventhubs",
                EventHubApiVersion,
                "Event Hub",
                cancellationToken).ConfigureAwait(false);

            HostedAzureInventoryChildListPartialEnumeration.NotePartialCollection(
                logger,
                listResult,
                namespaceResourceId,
                "Event Hub",
                collectionWarnings,
                AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration);

            foreach (JsonElement eventHub in listResult.Values)
            {
                if (!AzureInventoryMessagingAssociationExtractor.TryExtractEventHub(
                        namespaceResourceId,
                        eventHub,
                        out AzureInventoryMessagingAssociationRow? row)
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
                    "Hosted Azure extractor skipped Event Hub children for namespace {NamespaceId}.",
                    namespaceResourceId);
            }
        }
    }

    private static async Task CollectServiceBusChildrenAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string namespaceResourceId,
        List<AzureInventoryMessagingAssociationRow> rows,
        HashSet<string> seenKeys,
        List<string> collectionWarnings,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            HostedAzureArmChildCollectionReadResult queueListResult = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                namespaceResourceId,
                "queues",
                ServiceBusApiVersion,
                "Service Bus queue",
                cancellationToken).ConfigureAwait(false);

            HostedAzureInventoryChildListPartialEnumeration.NotePartialCollection(
                logger,
                queueListResult,
                namespaceResourceId,
                "Service Bus queue",
                collectionWarnings,
                AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration);

            foreach (JsonElement queue in queueListResult.Values)
            {
                if (AzureInventoryMessagingAssociationExtractor.TryExtractServiceBusChild(
                        namespaceResourceId,
                        queue,
                        AzureInventoryMessagingAssociationTypes.ServiceBusQueue,
                        out AzureInventoryMessagingAssociationRow? row)
                    && row is not null)
                {
                    AddRow(row, rows, seenKeys);
                }
            }

            HostedAzureArmChildCollectionReadResult topicListResult = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                namespaceResourceId,
                "topics",
                ServiceBusApiVersion,
                "Service Bus topic",
                cancellationToken).ConfigureAwait(false);

            HostedAzureInventoryChildListPartialEnumeration.NotePartialCollection(
                logger,
                topicListResult,
                namespaceResourceId,
                "Service Bus topic",
                collectionWarnings,
                AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration);

            foreach (JsonElement topic in topicListResult.Values)
            {
                if (AzureInventoryMessagingAssociationExtractor.TryExtractServiceBusChild(
                        namespaceResourceId,
                        topic,
                        AzureInventoryMessagingAssociationTypes.ServiceBusTopic,
                        out AzureInventoryMessagingAssociationRow? row)
                    && row is not null)
                {
                    AddRow(row, rows, seenKeys);
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug(
                    ex,
                    "Hosted Azure extractor skipped Service Bus children for namespace {NamespaceId}.",
                    namespaceResourceId);
            }
        }
    }

    private static void AddRow(
        AzureInventoryMessagingAssociationRow row,
        List<AzureInventoryMessagingAssociationRow> rows,
        HashSet<string> seenKeys)
    {
        string key = $"{row.ParentResourceId}|{row.ChildResourceId}|{row.ChildType}";

        if (seenKeys.Add(key))
        {
            rows.Add(row);
        }
    }
}
