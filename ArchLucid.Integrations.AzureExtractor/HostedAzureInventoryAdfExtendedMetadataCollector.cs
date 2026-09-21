using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects ADF triggers, integration runtimes, and mapping data flows for hosted Tier 2 packages.
/// </summary>
public static class HostedAzureInventoryAdfExtendedMetadataCollector
{
    public static async Task<HostedAzureInventoryAdfExtendedMetadataCollectResult> CollectAsync(
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

        List<AzureInventoryAdfTriggerRow> triggers = [];
        List<AzureInventoryAdfIntegrationRuntimeRow> integrationRuntimes = [];
        List<AzureInventoryAdfDataflowRow> dataflows = [];

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!AzureInventoryFactoryStyleResourceCatalog.IsFactoryStyleResourceType(resource.ResourceType)
                || string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            string factoryResourceId = resource.ResourceId.Trim();

            try
            {
                IReadOnlyList<JsonElement> triggerResources = await armReadClient
                    .ListFactoryTriggersAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);

                foreach (JsonElement triggerResource in triggerResources)
                {
                    if (AzureInventoryAdfTriggerSanitizer.TrySanitizeFromArmResource(
                            factoryResourceId,
                            triggerResource,
                            out AzureInventoryAdfTriggerRow? triggerRow)
                        && triggerRow is not null)
                    {
                        triggers.Add(triggerRow);
                    }
                }

                IReadOnlyList<JsonElement> integrationRuntimeResources = await armReadClient
                    .ListFactoryIntegrationRuntimesAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);

                foreach (JsonElement integrationRuntimeResource in integrationRuntimeResources)
                {
                    if (AzureInventoryAdfIntegrationRuntimeSanitizer.TrySanitizeFromArmResource(
                            factoryResourceId,
                            integrationRuntimeResource,
                            out AzureInventoryAdfIntegrationRuntimeRow? integrationRuntimeRow)
                        && integrationRuntimeRow is not null)
                    {
                        integrationRuntimes.Add(integrationRuntimeRow);
                    }
                }

                IReadOnlyList<JsonElement> dataflowResources = await armReadClient
                    .ListFactoryDataflowsAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);

                foreach (JsonElement dataflowResource in dataflowResources)
                {
                    if (AzureInventoryAdfDataflowExtractor.TryExtractFromArmResource(
                            factoryResourceId,
                            dataflowResource,
                            out AzureInventoryAdfDataflowRow? dataflowRow)
                        && dataflowRow is not null)
                    {
                        dataflows.Add(dataflowRow);
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped ADF extended metadata for factory {FactoryId}.",
                        factoryResourceId);
                }
            }
            catch (InvalidOperationException ex)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor stopped ADF extended metadata pagination for factory {FactoryId}.",
                        factoryResourceId);
                }
            }
        }

        return new HostedAzureInventoryAdfExtendedMetadataCollectResult
        {
            Triggers = triggers,
            IntegrationRuntimes = integrationRuntimes,
            Dataflows = dataflows,
        };
    }
}

public sealed class HostedAzureInventoryAdfExtendedMetadataCollectResult
{
    public IReadOnlyList<AzureInventoryAdfTriggerRow> Triggers
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryAdfIntegrationRuntimeRow> IntegrationRuntimes
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryAdfDataflowRow> Dataflows
    {
        get;
        init;
    } = [];
}
