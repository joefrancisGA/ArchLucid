using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects sanitized ADF linked-service rows for hosted Tier 2 extractor packages.
/// </summary>
public static class HostedAzureInventoryAdfLinkedServiceCollector
{
    public static async Task<IReadOnlyList<AzureInventoryAdfLinkedServiceRow>> CollectAsync(
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

        List<AzureInventoryAdfLinkedServiceRow> rows = [];

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!AzureInventoryFactoryStyleResourceCatalog.IsFactoryStyleResourceType(resource.ResourceType))
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
                IReadOnlyList<JsonElement> linkedServices = await armReadClient
                    .ListFactoryLinkedServicesAsync(accessToken, factoryResourceId, cancellationToken)
                    .ConfigureAwait(false);

                foreach (JsonElement linkedService in linkedServices)
                {
                    if (AzureInventoryAdfLinkedServiceSanitizer.TrySanitizeFromArmResource(factoryResourceId, linkedService, out AzureInventoryAdfLinkedServiceRow? row)
                        && row is not null)
                    {
                        rows.Add(row);
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(ex, "Hosted Azure extractor skipped ADF linked services for factory {FactoryId}.", factoryResourceId);
                }

                rows.Add(AzureInventoryAdfLinkedServiceSanitizer.BuildFactoryCollectionFailureRow(
                    factoryResourceId,
                    AzureInventoryAdfLinkedServiceCollectionStatus.Throttled,
                    $"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.FactoryCollectionFailedPrefix}{factoryResourceId}"));
            }
            catch (InvalidOperationException ex)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(ex, "Hosted Azure extractor stopped ADF linked-service pagination for factory {FactoryId}.", factoryResourceId);
                }

                rows.Add(AzureInventoryAdfLinkedServiceSanitizer.BuildFactoryCollectionFailureRow(
                    factoryResourceId,
                    AzureInventoryAdfLinkedServiceCollectionStatus.MalformedPayload,
                    $"{AzureInventoryAdfLinkedServiceCompletenessWarningCodes.FactoryCollectionFailedPrefix}{factoryResourceId}"));
            }
        }

        if (logger.IsEnabled(LogLevel.Debug))
        {
            logger.LogDebug("Hosted Azure extractor collected {Count} ADF linked-service rows.", rows.Count);
        }

        return rows;
    }
}
