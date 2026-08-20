using ArchLucid.Contracts.User;

using FluentAssertions;

using Xunit;

namespace ArchLucid.Contracts.Tests;

[Trait("Category", "Unit")]
public sealed class WhereToGoNextVisibilityValuesTests
{
    [Fact]
    public void Serialize_false_is_lowercase()
    {
        WhereToGoNextVisibilityValues.Serialize(false).Should().Be("false");
    }

    [Fact]
    public void ParseOrDefault_returns_true_when_unset()
    {
        WhereToGoNextVisibilityValues.ParseOrDefault(null).Should().BeTrue();
    }

    [Fact]
    public void ParseOrDefault_parses_false()
    {
        WhereToGoNextVisibilityValues.ParseOrDefault("false").Should().BeFalse();
    }
}
