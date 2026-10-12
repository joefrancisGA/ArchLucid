using ArchLucid.Application.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Admission;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureDomainAdmissionPatternTests
{
    [Fact]
    public void IsMatch_null_or_whitespace_is_false()
    {
        ArchitectureDomainAdmissionPattern.IsMatch(null).Should().BeFalse();
        ArchitectureDomainAdmissionPattern.IsMatch("").Should().BeFalse();
        ArchitectureDomainAdmissionPattern.IsMatch("   ").Should().BeFalse();
    }

    [Theory]
    [InlineData("authenticated APIs")]
    [InlineData("REST API")]
    [InlineData("system architecture")]
    public void IsMatch_architecture_vocabulary_is_true(string text)
    {
        ArchitectureDomainAdmissionPattern.IsMatch(text).Should().BeTrue();
    }

    [Fact]
    public void IsMatch_non_architecture_prose_is_false()
    {
        ArchitectureDomainAdmissionPattern.IsMatch("Write a chocolate cake recipe for the office potluck.")
            .Should()
            .BeFalse();
    }
}
