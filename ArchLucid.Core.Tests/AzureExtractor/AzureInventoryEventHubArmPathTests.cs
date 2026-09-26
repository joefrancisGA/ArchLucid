using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryEventHubArmPathTests
{
    [Fact]
    public void TryGetEventHubName_parses_child_hub_segment()
    {
        const string hubId =
            "/subscriptions/s/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns/eventhubs/orders";

        AzureInventoryEventHubArmPath.TryGetEventHubName(hubId, out string hubName).Should().BeTrue();
        hubName.Should().Be("orders");
    }

    [Fact]
    public void TryGetNamespaceId_returns_parent_namespace_for_child_hub()
    {
        const string namespaceId =
            "/subscriptions/s/resourceGroups/rg/providers/Microsoft.EventHub/namespaces/ns";
        const string hubId = $"{namespaceId}/eventhubs/orders";

        AzureInventoryEventHubArmPath.TryGetNamespaceId(hubId, out string parsedNamespace).Should().BeTrue();
        parsedNamespace.Should().Be(namespaceId);
    }
}
