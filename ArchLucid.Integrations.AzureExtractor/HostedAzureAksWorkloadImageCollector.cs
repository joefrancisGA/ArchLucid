using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public static class HostedAzureAksWorkloadImageCollector
{
    private const string ManagedClusterResourceType = "Microsoft.ContainerService/managedClusters";
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
            HostedAzureAksRunCommandResult commandResult = await postReadClient
                .RunAksWorkloadImageCommandAsync(
                    accessToken,
                    cluster.ResourceId,
                    cancellationToken)
                .ConfigureAwait(false);

            if (commandResult.Status is not HostedAzureAksRunCommandStatus.Succeeded)
            {
                warnings.Add(
                    AzureInventoryAksWorkloadImageCollectionWarnings.FormatHostedWarning(
                        MapStatusToReason(commandResult.Status),
                        cluster.ResourceId));
                continue;
            }

            if (string.IsNullOrWhiteSpace(commandResult.Logs))
            {
                continue;
            }

            IReadOnlyList<string> images = ParseImages(commandResult.Logs);

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

    private static string MapStatusToReason(HostedAzureAksRunCommandStatus status)
    {
        return status switch
        {
            HostedAzureAksRunCommandStatus.InsufficientRbac =>
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonInsufficientRbac,
            HostedAzureAksRunCommandStatus.MissingLogs =>
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonMissingLogs,
            HostedAzureAksRunCommandStatus.RunCommandFailed =>
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonRunCommandFailed,
            HostedAzureAksRunCommandStatus.HttpError =>
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonHttpError,
            HostedAzureAksRunCommandStatus.PollTimeout =>
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonPollTimeout,
            HostedAzureAksRunCommandStatus.Error =>
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonError,
            _ => AzureInventoryAksWorkloadImageCollectionWarnings.ReasonUnavailable,
        };
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
