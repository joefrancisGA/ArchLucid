using ArchLucid.Contracts.Governance.PolicyPacks;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PolicyPackSemVerVersionTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void TryParse_rejects_blank(string? raw)
    {
        PolicyPackSemVerVersion.TryParse(raw, out _).Should().BeFalse();
    }

    [Theory]
    [InlineData("1.0.0", "1.0.0")]
    [InlineData(" 1.0.0 ", "1.0.0")]
    [InlineData("\t1.0.0\t", "1.0.0")]
    [InlineData(" v1.0.0 ", "v1.0.0")]
    public void TryParse_normalizes_surrounding_whitespace(string raw, string expected)
    {
        PolicyPackSemVerVersion.TryParse(raw, out PolicyPackSemVerVersion parsed).Should().BeTrue();
        parsed.Value.Should().Be(expected);
    }

    [Theory]
    [InlineData("not-semver")]
    [InlineData("1.0")]
    public void TryParse_rejects_invalid_semver(string raw)
    {
        PolicyPackSemVerVersion.TryParse(raw, out _).Should().BeFalse();
    }

    [Fact]
    public void NormalizeLookupKey_trims_without_semver_validation()
    {
        PolicyPackSemVerVersion.NormalizeLookupKey(" 1.0.0 ").Should().Be("1.0.0");
    }
}
