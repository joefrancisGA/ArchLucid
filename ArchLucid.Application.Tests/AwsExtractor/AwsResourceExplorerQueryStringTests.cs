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
}
