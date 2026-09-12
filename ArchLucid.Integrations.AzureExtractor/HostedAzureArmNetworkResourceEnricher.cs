using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Merges type-scoped network/compute list GETs onto the subscription index (IE-RF-03/06).
/// </summary>
internal static class HostedAzureArmNetworkResourceEnricher
{
    public static async Task<HostedAzureArmNetworkResourceEnrichResult> EnrichAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        string subscriptionId,
        IReadOnlyList<HostedAzureArmResourceRecord> indexResources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(subscriptionId);
        ArgumentNullException.ThrowIfNull(indexResources);
        ArgumentNullException.ThrowIfNull(logger);

        List<HostedAzureArmResourceRecord> merged = indexResources.ToList();
        List<string> warnings = [];

        foreach (HostedAzureArmTypeListDescriptor descriptor in HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists)
        {
            try
            {
                IReadOnlyList<HostedAzureArmResourceRecord> typedResources = await armReadClient
                    .ListSubscriptionResourcesByTypeAsync(
                        accessToken,
                        subscriptionId,
                        descriptor.ResourceType,
                        cancellationToken)
                    .ConfigureAwait(false);

                merged = HostedAzureArmResourceRecordMerger
                    .MergeByResourceId(merged, typedResources)
                    .ToList();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                warnings.Add($"hosted-type-list-failed:{descriptor.ResourceType}");

                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor type list failed for {ResourceType}.",
                        descriptor.ResourceType);
                }
            }
        }

        IReadOnlyList<HostedAzureArmResourceRecord> privateDnsLinks = await TryListPrivateDnsVirtualNetworkLinksAsync(
            armReadClient,
            accessToken,
            subscriptionId,
            merged,
            logger,
            cancellationToken).ConfigureAwait(false);

        if (privateDnsLinks.Count > 0)
        {
            merged = HostedAzureArmResourceRecordMerger.MergeByResourceId(merged, privateDnsLinks).ToList();
        }

        return new HostedAzureArmNetworkResourceEnrichResult(merged, warnings);
    }

    private static async Task<IReadOnlyList<HostedAzureArmResourceRecord>> TryListPrivateDnsVirtualNetworkLinksAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        string subscriptionId,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmResourceRecord> linkResources = [];

        foreach (HostedAzureArmResourceRecord zone in resources.Where(resource =>
                     resource.ResourceType.Contains("privateDnsZones", StringComparison.OrdinalIgnoreCase)
                     && !resource.ResourceType.Contains("virtualNetworkLinks", StringComparison.OrdinalIgnoreCase)))
        {
            try
            {
                IReadOnlyList<HostedAzureArmResourceRecord> zoneLinks = await armReadClient
                    .ListPrivateDnsZoneVirtualNetworkLinksAsync(
                        accessToken,
                        subscriptionId,
                        zone.ResourceId,
                        cancellationToken)
                    .ConfigureAwait(false);

                linkResources.AddRange(zoneLinks);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor private DNS link list failed for zone {ZoneId}.",
                        zone.ResourceId);
                }
            }
        }

        return linkResources;
    }
}

internal sealed record HostedAzureArmNetworkResourceEnrichResult(
    IReadOnlyList<HostedAzureArmResourceRecord> Resources,
    IReadOnlyList<string> Warnings);
