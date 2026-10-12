using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public static class HostedAzureAksWorkloadImageCollector
{
    private const string ManagedClusterResourceType = "Microsoft.ContainerService/managedClusters";
    private const string WarningCode = "aks-workload-images-not-collected-hosted";

    public static async Task<HostedAzureAksWorkloadImageCollectResult> CollectAsync(
        IHostedAzureManagementPostReadClient postReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(postReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<HostedAzureArmResourceRecord> enrichedResources = [];
        List<string> warnings = [];

        foreach (HostedAzureArmResourceRecord cluster in resources.Where(IsManagedCluster))
        {
            string? commandOutput = await postReadClient
                .TryRunAksWorkloadImageCommandAsync(
                    accessToken,
                    cluster.ResourceId,
                    cancellationToken)
                .ConfigureAwait(false);

            if (commandOutput is null)
            {
                warnings.Add(WarningCode);
                continue;
            }

            IReadOnlyList<string> images = ParseImages(commandOutput);

            if (images.Count == 0)
            {
                continue;
            }

            Dictionary<string, object?> properties = new(StringComparer.OrdinalIgnoreCase);

            for (int index = 0; index < images.Count; index++)
            {
                properties[$"container.image[{index}]"] = images[index];
            }

            enrichedResources.Add(cluster with { Properties = properties });
        }

        return new HostedAzureAksWorkloadImageCollectResult
        {
            EnrichedResources = enrichedResources,
            CollectionWarnings = warnings,
        };
    }

    private static bool IsManagedCluster(HostedAzureArmResourceRecord resource)
    {
        return resource.ResourceType.Equals(
            ManagedClusterResourceType,
            StringComparison.OrdinalIgnoreCase);
    }

    private static IReadOnlyList<string> ParseImages(string commandOutput)
    {
        return commandOutput
            .Split(["\r\n", "\n", "\r"], StringSplitOptions.RemoveEmptyEntries)
            .Select(image => image.Trim())
            .Where(image => !string.IsNullOrWhiteSpace(image))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
