using ArchLucid.Api.Validators;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyPackRequestValidationRulesTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BePolicyPackSemVerVersion_rejects_blank(string? value)
    {
        PolicyPackRequestValidationRules.BePolicyPackSemVerVersion(value).Should().BeFalse();
    }

    [Theory]
    [InlineData("1.0.0")]
    [InlineData("v2.1.0-rc.1")]
    [InlineData("10.20.30+build")]
    public void BePolicyPackSemVerVersion_accepts_valid_semver(string value)
    {
        PolicyPackRequestValidationRules.BePolicyPackSemVerVersion(value).Should().BeTrue();
    }

    [Theory]
    [InlineData("not-semver")]
    [InlineData("1.0")]
    public void BePolicyPackSemVerVersion_rejects_invalid_semver(string value)
    {
        PolicyPackRequestValidationRules.BePolicyPackSemVerVersion(value).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void BeValidJson_accepts_blank(string? value)
    {
        PolicyPackRequestValidationRules.BeValidJson(value).Should().BeTrue();
    }

    [Fact]
    public void BeValidJson_accepts_object()
    {
        PolicyPackRequestValidationRules.BeValidJson("{\"rules\":[]}").Should().BeTrue();
    }

    [Fact]
    public void BeValidJson_rejects_malformed_json()
    {
        PolicyPackRequestValidationRules.BeValidJson("{not-json").Should().BeFalse();
    }
}
