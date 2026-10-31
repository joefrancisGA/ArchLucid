using ArchLucid.Integrations.AwsExtractor;

using FluentAssertions;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class AwsResourceExplorerQueryStringTests
{
    [Fact]
    public void ResolveForRegion_returns_china_partition_for_cn_region()
    {
        AwsResourceExplorerQueryString.ResolveForRegion("cn-north-1")
            .Should().Be("arn:aws-cn:*");

        AwsResourceExplorerQueryString.ResolveForRegion("cn-northwest-1")
            .Should().Be("arn:aws-cn:*");
    }

    [Fact]
    public void ResolveForRegion_throws_when_region_is_whitespace_only()
    {
        Action act = () => AwsResourceExplorerQueryString.ResolveForRegion("   ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void ResolveForRegion_trims_bounding_whitespace_before_partition_resolution()
    {
        AwsResourceExplorerQueryString.ResolveForRegion("  cn-north-1  ")
            .Should().Be("arn:aws-cn:*");

        AwsResourceExplorerQueryString.ResolveForRegion("\tus-gov-west-1\n")
            .Should().Be("arn:aws-us-gov:*");
    }
}
