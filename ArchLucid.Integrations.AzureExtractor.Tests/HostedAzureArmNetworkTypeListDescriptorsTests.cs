using ArchLucid.Integrations.AzureExtractor;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
public sealed class HostedAzureArmNetworkTypeListDescriptorsTests
{
    [Fact]
    public void SubscriptionLists_contains_restore_point_collections_with_compute_api_version()
    {
        HostedAzureArmTypeListDescriptor descriptor = Assert.Single(
            HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists,
            candidate => candidate.ResourceType == "Microsoft.Compute/restorePointCollections");

        Assert.Contains(
            "providers/Microsoft.Compute/restorePointCollections",
            descriptor.RelativePath,
            StringComparison.Ordinal);
        Assert.Contains("api-version=2024-03-01", descriptor.RelativePath, StringComparison.Ordinal);
    }
}
