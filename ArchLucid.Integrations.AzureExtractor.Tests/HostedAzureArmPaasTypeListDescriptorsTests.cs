using ArchLucid.Integrations.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureArmPaasTypeListDescriptorsTests
{
    [Fact]
    public void SubscriptionLists_contains_container_registries_with_registry_api_version()
    {
        HostedAzureArmTypeListDescriptor descriptor = Assert.Single(
            HostedAzureArmPaasTypeListDescriptors.SubscriptionLists,
            candidate => candidate.ResourceType == "Microsoft.ContainerRegistry/registries");

        Assert.Contains(
            "providers/Microsoft.ContainerRegistry/registries",
            descriptor.RelativePath,
            StringComparison.Ordinal);
        Assert.Contains("api-version=2023-07-01", descriptor.RelativePath, StringComparison.Ordinal);
    }
}
