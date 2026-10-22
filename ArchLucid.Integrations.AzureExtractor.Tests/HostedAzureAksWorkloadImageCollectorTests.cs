using ArchLucid.Core.AzureExtractor;
using ArchLucid.Integrations.AzureExtractor;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureAksWorkloadImageCollectorTests
{
    [Fact]
    public async Task CollectAsync_stores_distinct_images_on_managed_cluster()
    {
        Mock<IHostedAzureManagementPostReadClient> client = new();
        client
            .Setup(postClient => postClient.RunAksWorkloadImageCommandAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                HostedAzureAksRunCommandResult.SucceededWithLogs(
                    "acraephidevwus001.azurecr.io/app:1\r\n"
                    + "acraephidevwus001.azurecr.io/app:1\n"
                    + "mcr.microsoft.com/oss/kubernetes/pause:3.6\n"));

        HostedAzureArmResourceRecord cluster = CreateCluster();

        HostedAzureAksWorkloadImageCollectResult result =
            await HostedAzureAksWorkloadImageCollector.CollectAsync(
                client.Object,
                "token",
                [cluster],
                NullLogger.Instance,
                CancellationToken.None);

        HostedAzureArmResourceRecord enriched = Assert.Single(result.EnrichedResources);
        Assert.Equal(
            "acraephidevwus001.azurecr.io/app:1",
            enriched.Properties["container.image[0]"]);
        Assert.Equal(
            "mcr.microsoft.com/oss/kubernetes/pause:3.6",
            enriched.Properties["container.image[1]"]);
        Assert.Empty(result.CollectionWarnings);
    }

    [Fact]
    public async Task CollectAsync_does_not_warn_when_command_returns_empty_logs()
    {
        Mock<IHostedAzureManagementPostReadClient> client = new();
        client
            .Setup(postClient => postClient.RunAksWorkloadImageCommandAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureAksRunCommandResult.SucceededWithLogs(string.Empty));

        HostedAzureAksWorkloadImageCollectResult result =
            await HostedAzureAksWorkloadImageCollector.CollectAsync(
                client.Object,
                "token",
                [CreateCluster()],
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Empty(result.EnrichedResources);
        Assert.Empty(result.CollectionWarnings);
    }

    [Fact]
    public async Task CollectAsync_records_warning_when_command_is_unavailable()
    {
        Mock<IHostedAzureManagementPostReadClient> client = new();
        client
            .Setup(postClient => postClient.RunAksWorkloadImageCommandAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                HostedAzureAksRunCommandResult.Failed(
                    HostedAzureAksRunCommandStatus.InsufficientRbac,
                    403));

        HostedAzureAksWorkloadImageCollectResult result =
            await HostedAzureAksWorkloadImageCollector.CollectAsync(
                client.Object,
                "token",
                [CreateCluster()],
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Empty(result.EnrichedResources);
        Assert.Contains(
            AzureInventoryAksWorkloadImageCollectionWarnings.FormatHostedWarning(
                AzureInventoryAksWorkloadImageCollectionWarnings.ReasonInsufficientRbac,
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks"),
            result.CollectionWarnings);
    }

    private static HostedAzureArmResourceRecord CreateCluster()
    {
        return new HostedAzureArmResourceRecord(
            "Microsoft.ContainerService/managedClusters",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks",
            "aks",
            "westus",
            null,
            null,
            new Dictionary<string, object?>());
    }
}
