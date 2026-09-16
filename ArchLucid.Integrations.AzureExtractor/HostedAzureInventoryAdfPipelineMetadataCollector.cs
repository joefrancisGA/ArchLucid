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
    private const string DataFactoryResourceType = "Microsoft.DataFactory/factories";

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
        List<AzureInventoryAdfPipelineFlowRow> pipelineFlows = [];

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Equals(DataFactoryResourceType, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            string factoryResourceId = resource.ResourceId.Trim();

            try
            {
                IReadOnlyList<JsonElement> datasetResources = await armReadClient
                    .ListFactoryDatasetsAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);

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
                }

                IReadOnlyList<JsonElement> pipelineResources = await armReadClient
                    .ListFactoryPipelinesAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);

                pipelineFlows.AddRange(
                    AzureInventoryAdfPipelineFlowExtractor.ExtractFlows(factoryResourceId, pipelineResources));
            }
            catch (HttpRequestException ex)
            {
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
            Datasets = datasets,
            PipelineFlows = pipelineFlows,
        };
    }
}

public sealed class HostedAzureInventoryAdfPipelineMetadataCollectResult
{
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
