using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects Event Grid subscriptions for hosted Tier 2 packages (AX-DE-11).
/// </summary>
public static class HostedAzureInventoryEventGridSubscriptionCollector
{
    private const string EventGridApiVersion = "2022-06-15";

    public static async Task<IReadOnlyList<AzureInventoryEventGridSubscriptionRow>> CollectAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string? subscriptionId,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<AzureInventoryEventGridSubscriptionRow> rows = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!IsEventGridSourceResourceType(resource.ResourceType) || string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            try
            {
                IReadOnlyList<JsonElement> subscriptions = await armReadClient.ListChildJsonElementsAsync(
                    accessToken,
                    resource.ResourceId.Trim(),
                    "eventSubscriptions",
                    EventGridApiVersion,
                    "Event Grid subscription",
                    cancellationToken).ConfigureAwait(false);

                AddSubscriptions(resource.ResourceId.Trim(), subscriptions, rows, seenKeys);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped Event Grid subscriptions for source {SourceId}.",
                        resource.ResourceId);
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(subscriptionId))
        {
            try
            {
                string trimmedSubscriptionId = subscriptionId.Trim();
                string sourceResourceId = $"/subscriptions/{trimmedSubscriptionId}";
                IReadOnlyList<JsonElement> subscriptions = await armReadClient.ListChildJsonElementsAsync(
                    accessToken,
                    sourceResourceId,
                    "providers/Microsoft.EventGrid/eventSubscriptions",
                    EventGridApiVersion,
                    "subscription Event Grid subscription",
                    cancellationToken).ConfigureAwait(false);

                AddSubscriptions(sourceResourceId, subscriptions, rows, seenKeys);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped subscription-scoped Event Grid subscriptions.");
                }
            }
        }

        return rows;
    }

    private static bool IsEventGridSourceResourceType(string resourceType)
    {
        return resourceType.Equals("Microsoft.EventGrid/topics", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("Microsoft.EventGrid/domains", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("Microsoft.EventGrid/systemTopics", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddSubscriptions(
        string sourceResourceId,
        IReadOnlyList<JsonElement> subscriptions,
        List<AzureInventoryEventGridSubscriptionRow> rows,
        HashSet<string> seenKeys)
    {
        foreach (JsonElement subscription in subscriptions)
        {
            if (!AzureInventoryEventGridSubscriptionSanitizer.TrySanitizeFromArmResource(
                    sourceResourceId,
                    subscription,
                    out AzureInventoryEventGridSubscriptionRow? row)
                || row is null)
            {
                continue;
            }

            string key = $"{row.SourceResourceId}|{row.SubscriptionName}|{row.DestinationResourceId}|{row.DestinationHost}";

            if (seenKeys.Add(key))
            {
                rows.Add(row);
            }
        }
    }
}
