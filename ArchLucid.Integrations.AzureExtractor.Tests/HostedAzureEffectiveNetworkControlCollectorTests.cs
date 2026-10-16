using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureEffectiveNetworkControlCollectorTests
{
    [Fact]
    public async Task CollectAsync_caps_nic_count_and_emits_warning()
    {
        List<HostedAzureArmResourceRecord> resources = [];

        for (int index = 0; index < HostedAzureEffectiveNetworkControlCollector.MaxNicCount + 5; index++)
        {
            resources.Add(new HostedAzureArmResourceRecord(
                ResourceType: "Microsoft.Network/networkInterfaces",
                ResourceId:
                $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-{index:D3}",
                Name: $"nic-{index:D3}",
                Location: "eastus",
                Sku: null,
                Tags: null,
                Properties: new Dictionary<string, object?>()));
        }

        Mock<IHostedAzureArmReadClient> armClient = new(MockBehavior.Strict);
        armClient
            .Setup(client => client.ListEffectiveNetworkControlsForNicAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        HostedAzureEffectiveNetworkControlCollectResult result = await HostedAzureEffectiveNetworkControlCollector.CollectAsync(
            armClient.Object,
            "token",
            resources,
            NullLogger.Instance,
            CancellationToken.None);

        Assert.True(result.Capped);
        Assert.Contains(AzureInventoryRelationshipCompletenessWarningCodes.EffectiveControlsCapped, result.Warnings);
        Assert.Empty(result.Rows);
        armClient.Verify(
            client => client.ListEffectiveNetworkControlsForNicAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Exactly(HostedAzureEffectiveNetworkControlCollector.MaxNicCount));
    }
}
