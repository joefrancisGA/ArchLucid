using ArchLucid.Core.Text;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Text;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EnglishNegationTokenizerTests
{
    [Theory]
    [InlineData("must not expose Redis to the internet")]
    [InlineData("do not require a public IP")]
    [InlineData("shouldn't allow SSH from 0.0.0.0/0")]
    [InlineData("teams mightn't configure encryption at rest")]
    [InlineData("workloads mightn't configure to use encryption at rest")]
    public void ContainsNegation_detects_realistic_architect_negation(string text)
    {
        EnglishNegationTokenizer.ContainsNegation(text).Should().BeTrue();
    }

    [Theory]
    [InlineData("require private endpoints")]
    [InlineData("might require NAT")]
    public void ContainsNegation_ignores_affirmative_requirements(string text)
    {
        EnglishNegationTokenizer.ContainsNegation(text).Should().BeFalse();
    }
}
