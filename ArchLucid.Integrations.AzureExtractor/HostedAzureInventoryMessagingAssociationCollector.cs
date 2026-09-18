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

    public static async Task<IReadOnlyList<AzureInventoryMessagingAssociationRow>> CollectAsync(
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
                    logger,
                    cancellationToken).ConfigureAwait(false);
            }
        }

        return rows;
    }

    private static async Task CollectEventHubChildrenAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string namespaceResourceId,
        List<AzureInventoryMessagingAssociationRow> rows,
        HashSet<string> seenKeys,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<JsonElement> eventHubs = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                namespaceResourceId,
                "eventhubs",
                EventHubApiVersion,
                "Event Hub",
                cancellationToken).ConfigureAwait(false);

            foreach (JsonElement eventHub in eventHubs)
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
        ILogger logger,
        CancellationToken cancellationToken)
    {
        try
        {
            IReadOnlyList<JsonElement> queues = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                namespaceResourceId,
                "queues",
                ServiceBusApiVersion,
                "Service Bus queue",
                cancellationToken).ConfigureAwait(false);

            foreach (JsonElement queue in queues)
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

            IReadOnlyList<JsonElement> topics = await armReadClient.ListChildJsonElementsAsync(
                accessToken,
                namespaceResourceId,
                "topics",
                ServiceBusApiVersion,
                "Service Bus topic",
                cancellationToken).ConfigureAwait(false);

            foreach (JsonElement topic in topics)
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
