using ArchLucid.Contracts.User;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class SampleReviewsOnOverviewVisibilityValuesTests
{
    [Fact]
    public void Serialize_false_is_lowercase()
    {
        SampleReviewsOnOverviewVisibilityValues.Serialize(false).Should().Be("false");
    }

    [Fact]
    public void ParseOrDefault_returns_true_when_unset()
    {
        SampleReviewsOnOverviewVisibilityValues.ParseOrDefault(null).Should().BeTrue();
    }

    [Fact]
    public void ParseOrDefault_parses_false()
    {
        SampleReviewsOnOverviewVisibilityValues.ParseOrDefault("false").Should().BeFalse();
    }
}
