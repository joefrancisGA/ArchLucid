using ArchLucid.Core.Marketing;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Marketing;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MarketingAttributionBucketMapperTests
{
    [Theory]
    [InlineData("cpc", "paid_direct")]
    [InlineData("ppc", "paid_direct")]
    [InlineData("email", "referral")]
    [InlineData("organic", "organic")]
    [InlineData(null, "unknown")]
    [InlineData("", "unknown")]
    public void MapCoarseMedium_buckets_low_cardinality(string? medium, string expected)
    {
        MarketingAttributionBucketMapper.MapCoarseMedium(medium).Should().Be(expected);
    }

    [Theory]
    [InlineData("google", "google")]
    [InlineData("Google Ads", "google")]
    [InlineData("linkedin", "linkedin")]
    [InlineData("bing", "bing")]
    [InlineData("archlucid", "internal")]
    [InlineData(null, "unknown")]
    public void MapCoarsePlatform_buckets_low_cardinality(string? source, string expected)
    {
        MarketingAttributionBucketMapper.MapCoarsePlatform(source).Should().Be(expected);
    }
}
