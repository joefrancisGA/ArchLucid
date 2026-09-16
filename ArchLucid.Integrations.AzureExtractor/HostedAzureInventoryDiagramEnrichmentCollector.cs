using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Orchestrates AX-DE-11–13 hosted diagram enrichment collection.
/// </summary>
public static class HostedAzureInventoryDiagramEnrichmentCollector
{
    public static async Task<HostedAzureDiagramEnrichmentCollectResult> CollectAsync(
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

        List<string> collectionWarnings = [];

        IReadOnlyList<AzureInventoryEventGridSubscriptionRow> eventGridSubscriptions =
            await HostedAzureInventoryEventGridSubscriptionCollector.CollectAsync(
                armReadClient,
                accessToken,
                subscriptionId,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        HostedAzureInventoryLogicAppConnectionCollectResult logicAppConnectionsResult =
            await HostedAzureInventoryLogicAppConnectionCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        if (logicAppConnectionsResult.StandardLogicAppPresent)
        {
            collectionWarnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.LogicAppStandardNotCollected);
        }

        IReadOnlyList<AzureInventoryMessagingAssociationRow> messagingAssociations =
            await HostedAzureInventoryMessagingAssociationCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        return new HostedAzureDiagramEnrichmentCollectResult
        {
            EventGridSubscriptions = eventGridSubscriptions,
            LogicAppConnections = logicAppConnectionsResult.Connections,
            MessagingAssociations = messagingAssociations,
            CollectionWarnings = collectionWarnings,
        };
    }
}
