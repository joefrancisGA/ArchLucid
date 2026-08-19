using ArchLucid.Contracts.Common;
using ArchLucid.Core.Costing;
using ArchLucid.Core.GoldenCorpus;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.GoldenCohort;

[Trait("Category", "Unit")]
public sealed class GoldenCohortMultiCloudArchitectureRequestFactoryTests
{
    [Fact]
    public void BuildAwsWebWorkload_sets_aws_cloud_provider()
    {
        GoldenCohortMultiCloudArchitectureRequestFactory.BuildAwsWebWorkload("001")
            .CloudProvider
            .Should()
            .Be(CloudProvider.Aws);
    }

    [Fact]
    public void BuildGcpApiPlatform_sets_gcp_cloud_provider()
    {
        GoldenCohortMultiCloudArchitectureRequestFactory.BuildGcpApiPlatform("001")
            .CloudProvider
            .Should()
            .Be(CloudProvider.Gcp);
    }

    [Fact]
    public void MultiCloud_cohort_document_loads_four_items()
    {
        string path = Path.Combine(
            RepoPaths.FindRepoRoot(),
            "tests",
            "golden-cohort",
            "cohort-multicloud.json");

        GoldenCohortDocument document = GoldenCohortDocument.Load(path);

        document.Items.Should().HaveCount(4);
        document.Items.Should().OnlyContain(item => !string.IsNullOrWhiteSpace(item.Id));
    }

    [Fact]
    public void BuildAwsServerlessIngestion_sets_aws_cloud_provider()
    {
        GoldenCohortMultiCloudArchitectureRequestFactory.BuildAwsServerlessIngestion("002")
            .CloudProvider
            .Should()
            .Be(CloudProvider.Aws);
    }

    [Fact]
    public void BuildGcpComputeLift_sets_gcp_cloud_provider()
    {
        GoldenCohortMultiCloudArchitectureRequestFactory.BuildGcpComputeLift("002")
            .CloudProvider
            .Should()
            .Be(CloudProvider.Gcp);
    }
}

internal static class RepoPaths
{
    internal static string FindRepoRoot()
    {
        DirectoryInfo? dir = new(Directory.GetCurrentDirectory());

        while (dir is not null)
        {
            if (File.Exists(Path.Combine(dir.FullName, "ArchLucid.sln")))
                return dir.FullName;

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Repository root not found.");
    }
}
