using ArchLucid.Application.CloudExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.CloudExtractor;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class HostedCloudExtractorRunResultTests
{
    [Fact]
    public void CreateFeatureDisabled_includes_cloud_label_and_configuration_section()
    {
        HostedCloudExtractorRunResult result =
            HostedCloudExtractorRunResult.CreateFeatureDisabled("Azure", "HostedAzureExtractor");

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedCloudExtractorRunFailureKind.FeatureDisabled);
        result.FailureDetail.Should().Contain("Azure");
        result.FailureDetail.Should().Contain("HostedAzureExtractor:Enabled=false");
    }

    [Fact]
    public void CreateSuccess_sets_package_and_resource_count()
    {
        Guid packageId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        HostedCloudExtractorRunResult result = HostedCloudExtractorRunResult.CreateSuccess(packageId, 42);

        result.Succeeded.Should().BeTrue();
        result.PackageId.Should().Be(packageId);
        result.ResourceCount.Should().Be(42);
        result.FailureKind.Should().Be(HostedCloudExtractorRunFailureKind.None);
    }
}
