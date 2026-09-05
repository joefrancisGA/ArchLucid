using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureExtractorSensitivePropertyRedactorTests
{
    [Theory]
    [InlineData("connectionString", true)]
    [InlineData("primaryKey", true)]
    [InlineData("location", false)]
    [InlineData("nonsecret", false)]
    [InlineData("passwordless", false)]
    [InlineData("connectionstringfree", false)]
  public void IsSensitiveKey_detects_secret_like_names(string key, bool expected)
    {
        AzureExtractorSensitivePropertyRedactor.IsSensitiveKey(key).Should().Be(expected);
    }

    [Fact]
    public void RedactValue_returns_marker()
    {
        AzureExtractorSensitivePropertyRedactor.RedactValue("super-secret").Should().Be("[REDACTED]");
    }
}
