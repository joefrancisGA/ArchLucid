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
        bool partial = false;
        List<AzureInventoryAdfIntegrationRuntimeRow> integrationRuntimes = [];
        List<AzureInventoryAdfDataflowRow> dataflows = [];

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!AzureInventoryFactoryStyleResourceCatalog.IsFactoryStyleResourceType(resource.ResourceType))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                partial = true;
                continue;
            }

            string factoryResourceId = resource.ResourceId.Trim();

            try
            {
                IReadOnlyList<JsonElement> triggerResources = await armReadClient
                    .ListFactoryTriggersAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= triggerResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };

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
                    else
                    {
                        partial = true;
                    }
                }

                IReadOnlyList<JsonElement> integrationRuntimeResources = await armReadClient
                    .ListFactoryIntegrationRuntimesAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= integrationRuntimeResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };

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
                    else
                    {
                        partial = true;
                    }
                }

                IReadOnlyList<JsonElement> datasetResources = await armReadClient
                    .ListFactoryDatasetsAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= datasetResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };
                Dictionary<string, string> datasetLinkedServiceNames = [];

                foreach (JsonElement datasetResource in datasetResources)
                {
                    if (AzureInventoryAdfDatasetSanitizer.TrySanitizeFromArmResource(
                            factoryResourceId,
                            datasetResource,
                            out AzureInventoryAdfDatasetRow? datasetRow)
                        && datasetRow is not null
                        && datasetRow.CollectionStatus.Equals(
                            AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        datasetLinkedServiceNames[datasetRow.DatasetName] = datasetRow.LinkedServiceName;
                    }
                }

                IReadOnlyList<JsonElement> dataflowResources = await armReadClient
                    .ListFactoryDataflowsAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= dataflowResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };

                foreach (JsonElement dataflowResource in dataflowResources)
                {
                    if (AzureInventoryAdfDataflowExtractor.TryExtractFromArmResource(
                            factoryResourceId,
                            dataflowResource,
                            datasetLinkedServiceNames,
                            out AzureInventoryAdfDataflowRow? dataflowRow)
                        && dataflowRow is not null)
                    {
                        dataflows.Add(dataflowRow);
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                partial = true;
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
                partial = true;
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
            PartialCollection = partial,
            Triggers = triggers,
            IntegrationRuntimes = integrationRuntimes,
            Dataflows = dataflows,
        };
    }
}

public sealed class HostedAzureInventoryAdfExtendedMetadataCollectResult
{
    public bool PartialCollection { get; init; }

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
