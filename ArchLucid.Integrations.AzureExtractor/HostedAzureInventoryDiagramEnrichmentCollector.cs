using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Orchestrates AX-DE-11–14 hosted diagram enrichment collection.
/// </summary>
public static class HostedAzureInventoryDiagramEnrichmentCollector
{
    public static async Task<HostedAzureDiagramEnrichmentCollectResult> CollectAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        string? subscriptionId,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        bool includeAppSettingsHosts,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<string> collectionWarnings = [];

        HostedAzureInventoryEventGridSubscriptionCollectResult eventGridSubscriptionsResult =
            await HostedAzureInventoryEventGridSubscriptionCollector.CollectAsync(
                armReadClient,
                accessToken,
                subscriptionId,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        collectionWarnings.AddRange(eventGridSubscriptionsResult.CollectionWarnings);

        HostedAzureInventoryLogicAppConnectionCollectResult logicAppConnectionsResult =
            await HostedAzureInventoryLogicAppConnectionCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        HostedAzureInventoryMessagingAssociationCollectResult messagingAssociationsResult =
            await HostedAzureInventoryMessagingAssociationCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        collectionWarnings.AddRange(messagingAssociationsResult.CollectionWarnings);

        HostedAzureInventoryPaasChildCollectResult paasChildResult =
            await HostedAzureInventoryPaasChildCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        collectionWarnings.AddRange(paasChildResult.CollectionWarnings);

        HostedAzureInventoryServiceConnectorCollectResult serviceConnectorLinksResult =
            await HostedAzureInventoryServiceConnectorCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        collectionWarnings.AddRange(serviceConnectorLinksResult.CollectionWarnings);

        HostedAzureInventoryAppSettingHostCollectResult containerAppAppSettingHostResult =
            await HostedAzureInventoryAppSettingHostCollector.CollectAsync(
                armReadClient,
                accessToken,
                resources,
                logger,
                cancellationToken).ConfigureAwait(false);

        List<AzureInventoryAppSettingHostRow> appSettingHosts = containerAppAppSettingHostResult.AppSettingHosts.ToList();
        collectionWarnings.AddRange(containerAppAppSettingHostResult.CollectionWarnings);

        if (includeAppSettingsHosts)
        {
            HostedAzureInventoryWebAppAppSettingHostCollectResult webAppAppSettingHostResult =
                await HostedAzureInventoryWebAppAppSettingHostCollector.CollectAsync(
                    armReadClient,
                    accessToken,
                    resources,
                    logger,
                    cancellationToken).ConfigureAwait(false);

            appSettingHosts.AddRange(webAppAppSettingHostResult.AppSettingHosts);
            collectionWarnings.AddRange(webAppAppSettingHostResult.CollectionWarnings);
        }
        else
        {
            collectionWarnings.Add(AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsNotCollectedHostedGetOnly);
        }

        return new HostedAzureDiagramEnrichmentCollectResult
        {
            EventGridSubscriptions = eventGridSubscriptionsResult.Subscriptions,
            LogicAppConnections = logicAppConnectionsResult.Connections,
            MessagingAssociations = messagingAssociationsResult.Associations,
            PaasChildAssociations = paasChildResult.Associations,
            ServiceConnectorLinks = serviceConnectorLinksResult.Links,
            AppSettingHosts = appSettingHosts,
            CollectionWarnings = collectionWarnings,
        };
    }
}
