using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ApiKeyPlaceholderValueTests
{
    [Fact]
    public void IsPlaceholderValue_WhenNullOrEmptyOrWhitespace_returns_false()
    {
        ApiKeyPlaceholderValue.IsPlaceholderValue(null).Should().BeFalse();
        ApiKeyPlaceholderValue.IsPlaceholderValue(string.Empty).Should().BeFalse();
        ApiKeyPlaceholderValue.IsPlaceholderValue("   ").Should().BeFalse();
    }

    [Theory]
    [InlineData("changeme")]
    [InlineData("CHANGE_ME")]
    [InlineData("placeholder")]
    [InlineData("your-api-key")]
    [InlineData("replace-me")]
    [InlineData("secret")]
    [InlineData("test")]
    [InlineData("admin")]
    [InlineData("password")]
    public void IsPlaceholderValue_WhenMatchesObviousToken_returns_true(string value)
    {
        ApiKeyPlaceholderValue.IsPlaceholderValue(value).Should().BeTrue();
        ApiKeyPlaceholderValue.IsPlaceholderValue($"  {value}  ").Should().BeTrue();
    }

    [Fact]
    public void IsPlaceholderValue_WhenShorterThan24Characters_returns_true()
    {
        ApiKeyPlaceholderValue.IsPlaceholderValue("short-but-random-xyz").Should().BeTrue();
    }

    [Fact]
    public void IsPlaceholderValue_WhenLongRandomLikeSecret_returns_false()
    {
        ApiKeyPlaceholderValue.IsPlaceholderValue("a7f3c9e2b1d80456n8m0k2j4h6g8f0e2").Should().BeFalse();
    }
}
