using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Merges type-scoped PaaS list GETs onto the subscription index (AX-DE-14).
/// </summary>
internal static class HostedAzureArmPaasResourceEnricher
{
    public static async Task<HostedAzureArmPaasResourceEnrichResult> EnrichAsync(
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

        foreach (HostedAzureArmTypeListDescriptor descriptor in HostedAzureArmPaasTypeListDescriptors.SubscriptionLists)
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
                warnings.Add($"hosted-paas-type-list-failed:{descriptor.ResourceType}");

                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor PaaS type list failed for {ResourceType}.",
                        descriptor.ResourceType);
                }
            }
        }

        return new HostedAzureArmPaasResourceEnrichResult(merged, warnings);
    }
}

internal sealed record HostedAzureArmPaasResourceEnrichResult(
    IReadOnlyList<HostedAzureArmResourceRecord> Resources,
    IReadOnlyList<string> Warnings);
