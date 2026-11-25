using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects sanitized ADF dataset and declared pipeline-flow rows for hosted Tier 2 packages.
/// </summary>
public static class HostedAzureInventoryAdfPipelineMetadataCollector
{
    public static async Task<HostedAzureInventoryAdfPipelineMetadataCollectResult> CollectAsync(
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

        List<AzureInventoryAdfDatasetRow> datasets = [];
        bool partial = false;
        List<AzureInventoryAdfPipelineFlowRow> pipelineFlows = [];

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
                IReadOnlyList<JsonElement> datasetResources = await armReadClient
                    .ListFactoryDatasetsAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= datasetResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };

                foreach (JsonElement datasetResource in datasetResources)
                {
                    if (AzureInventoryAdfDatasetSanitizer.TrySanitizeFromArmResource(
                            factoryResourceId,
                            datasetResource,
                            out AzureInventoryAdfDatasetRow? datasetRow)
                        && datasetRow is not null)
                    {
                        datasets.Add(datasetRow);
                    }
                    else
                    {
                        partial = true;
                    }
                }

                IReadOnlyList<JsonElement> dataflowResources = await armReadClient
                    .ListFactoryDataflowsAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= dataflowResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };

                List<AzureInventoryAdfDataflowRow> dataflowRows = [];

                foreach (JsonElement dataflowResource in dataflowResources)
                {
                    if (AzureInventoryAdfDataflowExtractor.TryExtractFromArmResource(
                            factoryResourceId,
                            dataflowResource,
                            datasets
                                .Where(dataset => dataset.CollectionStatus.Equals(
                                    AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
                                    StringComparison.OrdinalIgnoreCase))
                                .Where(dataset => dataset.FactoryResourceId.Equals(
                                    factoryResourceId,
                                    StringComparison.OrdinalIgnoreCase))
                                .Where(dataset => !string.IsNullOrWhiteSpace(dataset.DatasetName)
                                    && !string.IsNullOrWhiteSpace(dataset.LinkedServiceName))
                                .ToDictionary(
                                    dataset => dataset.DatasetName,
                                    dataset => dataset.LinkedServiceName,
                                    StringComparer.OrdinalIgnoreCase),
                            out AzureInventoryAdfDataflowRow? dataflowRow)
                        && dataflowRow is not null)
                    {
                        dataflowRows.Add(dataflowRow);
                    }
                }

                IReadOnlyList<JsonElement> pipelineResources = await armReadClient
                    .ListFactoryPipelinesAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);
                partial |= pipelineResources is HostedAzureAdfCollection<JsonElement> { PartialCollection: true };

                pipelineFlows.AddRange(
                    AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(
                        factoryResourceId,
                        pipelineResources,
                        dataflowRows: dataflowRows));
            }
            catch (HttpRequestException ex)
            {
                partial = true;
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped ADF pipeline metadata for factory {FactoryId}.",
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
                        "Hosted Azure extractor stopped ADF pipeline metadata pagination for factory {FactoryId}.",
                        factoryResourceId);
                }
            }
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug(
                "Hosted Azure extractor collected {DatasetCount} ADF dataset rows and {FlowCount} pipeline flow rows.",
                datasets.Count,
                pipelineFlows.Count);
        }

        return new HostedAzureInventoryAdfPipelineMetadataCollectResult
        {
            PartialCollection = partial,
            Datasets = datasets,
            PipelineFlows = pipelineFlows,
        };
    }
}

public sealed class HostedAzureInventoryAdfPipelineMetadataCollectResult
{
    public bool PartialCollection { get; init; }

    public IReadOnlyList<AzureInventoryAdfDatasetRow> Datasets
    {
        get;
        init;
    } = [];

    public IReadOnlyList<AzureInventoryAdfPipelineFlowRow> PipelineFlows
    {
        get;
        init;
    } = [];
}
